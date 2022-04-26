import { literal, Op } from 'sequelize';
import { Errors } from '../utils/errors';
import { QuestController } from '../controllers/quest/controller.quest';
import { error, output } from '../utils';
import { ChecksListQuest } from "../checks-list/checksList.quest";
import { QuestNotificationActions } from "../controllers/controller.broker";
import { MediaController } from '../controllers/controller.media';
import { updateQuestsStatisticJob } from '../jobs/updateQuestsStatistic';
import { SkillsFiltersController } from '../controllers/controller.skillsFilters';
import { EmployerControllerFactory, WorkerControllerFactory } from '../factories/factory.userController';
import { QuestControllerFactory } from '../factories/factory.questController';
import {
  User,
  Quest,
  QuestChat,
  QuestDispute,
  QuestsResponse,
  QuestsResponseType,
  DisputeStatus,
  QuestStatus,
  QuestsReview,
  QuestsResponseStatus,
  QuestsStarred,
  UserRole,
} from '@workquest/database-models/lib/models';


export const searchQuestFields = [
  'title',
  'description',
  'locationPlaceName'
];

export async function getQuest(r) {
  const user: User = r.auth.credentials;

  const include = [{
    model: QuestsStarred,
    as: "star",
    where: { userId: r.auth.credentials.id },
    required: false
  }, {
    model: QuestsResponse,
    as: "response",
    where: { workerId: r.auth.credentials.id },
    required: false
  }, {
    model: User.scope('shortWithWallet'),
    as: 'user'
  }, {
    model: User.scope('shortWithWallet'),
    as: 'assignedWorker'
  }, {
    model: QuestDispute.unscoped(),
    as: 'openDispute',
    required: false,
    where: {
      [Op.or]: [
        { opponentUserId: r.auth.credentials.id },
        { openDisputeUserId: r.auth.credentials.id },
      ],
      status: { [Op.in]: [DisputeStatus.pending, DisputeStatus.inProgress] },
    },
  }, {
    model: QuestsReview.unscoped(),
    as: 'yourReview',
    where: { fromUserId: r.auth.credentials.id },
    required: false,
  }] as any[];

  if (user.role === UserRole.Worker) {
    include.push({
      model: QuestChat.scope('idsOnly'),
      as: 'questChat',
      required: false,
      where: { workerId: user.id },
    });
  }

  const quest = await Quest.findOne({
    where: { id: r.params.questId },
    include,
  });

  if (!quest) {
    return error(Errors.NotFound, 'Quest not found', { questId: r.params.questId });
  }

  return output(quest);
}

export async function createQuest(r) {
  const mediaModels = await MediaController.getMedias(r.payload.medias);
  const employerController = EmployerControllerFactory.createByUserModel(r.auth.credentials);

  const avatarModel = mediaModels.length === 0
    ? null
    : mediaModels[0]

  const questController = await r.server.app.db.transaction(async (tx) => {
   const questController = await QuestController.create({
     avatar: avatarModel,
     employer: employerController.user,
      ...r.payload,
    }, { tx });

   await Promise.all([
     questController.createRaiseView({ tx }),
     questController.setMedias(mediaModels, { tx }),
     questController.setQuestSpecializations(r.payload.specializationKeys, { tx }),
   ]);

    return questController;
  }) as QuestController;

  await updateQuestsStatisticJob({
    userId: employerController.user.id,
    role: UserRole.Employer,
  });

  return output(questController.quest);
}

export async function editQuest(r) {
  const employerController = EmployerControllerFactory.createByUserModel(r.auth.credentials);
  const questController = await QuestControllerFactory.createById(r.params.questId);

  const checksListQuest = new ChecksListQuest(questController.quest);

  checksListQuest
    .checkOwner(employerController.user)
    .checkQuestStatuses(QuestStatus.Pending, QuestStatus.Recruitment)

  const mediaModels = await MediaController.getMedias(r.payload.medias);

  const avatarId = mediaModels.length === 0
    ? null
    : mediaModels[0].id

  await r.server.app.db.transaction(async (tx) => {
    await Promise.all([
      questController.setMedias(mediaModels, { tx }),
      questController.setQuestSpecializations(r.payload.specializationKeys, { tx }),
      questController.update({ avatarId, ...r.payload }, { tx }),
    ]);
  });

  const questsResponseWorkerIds = await QuestsResponse.findAll({
    attributes: ['workerId'],
    where: {
      questId: questController.quest.id,
      status: QuestsResponseStatus.Open,
    },
  });

  if (questsResponseWorkerIds.length !== 0) {
    r.server.app.broker.sendQuestNotification({
      action: QuestNotificationActions.questEdited,
      recipients: questsResponseWorkerIds.map(_ => _.workerId),
      data: questController.quest,
    });
  }

  return output(questController.quest);
}

// TODO отрефракторить!
export function getQuests(type: 'list' | 'points', requester?: 'worker' | 'employer') {
  return async function(r) {
    const user: User = r.auth.credentials;

    const entersAreaLiteral = literal(
      'st_within("Quest"."locationPostGIS", st_makeenvelope(:northLng, :northLat, :southLng, :southLat, 4326))'
    );
    const questChatLiteral = literal(
      'CASE WHEN "questChat->quest" = NULL THEN NULL ELSE "questChat->quest"."id" END'
    );
    const questSpecializationOnlyPathsLiteral = literal(
      '(1 = (CASE WHEN EXISTS (SELECT "id" FROM "QuestSpecializationFilters" WHERE "questId" = "Quest"."id" AND "QuestSpecializationFilters"."path" IN (:path)) THEN 1 END))'
    );
    const questSpecializationOnlyIndustryKeysLiteral = literal(
      '(1 = (CASE WHEN EXISTS (SELECT * FROM "QuestSpecializationFilters" WHERE "questId" = "Quest"."id" AND "QuestSpecializationFilters"."industryKey" IN (:industryKey)) THEN 1 END))'
    );
    const questSpecializationIndustryKeysAndPathsLiteral = literal(
      '(1 = (CASE WHEN EXISTS (SELECT * FROM "QuestSpecializationFilters" WHERE "questId" = "Quest"."id" AND "QuestSpecializationFilters"."path" IN (:path)) THEN 1 END))' +
      'OR (1 = (CASE WHEN EXISTS (SELECT * FROM "QuestSpecializationFilters" WHERE "questId" = "Quest"."id" AND "QuestSpecializationFilters"."industryKey" IN (:industryKey)) THEN 1 END))'
    );
    const userSearchLiteral = literal(
      // TODO добавь эти поля в replace типо так ILIKE '%:searchByFirstName%'`
      `(SELECT "firstName" FROM "Users" WHERE "id" = "Quest"."userId") ILIKE '%${r.query.q}%'` +
      `OR (SELECT "lastName" FROM "Users" WHERE "id" = "Quest"."userId") ILIKE '%${r.query.q}%'`
    );
    const questChatWorkerLiteral = literal(
      '"questChat"."workerId" = "Quest"."assignedWorkerId"'
    );
    const questRaiseViewLiteral = literal(
      '(SELECT "type" FROM "QuestRaiseViews" WHERE "questId" = "Quest"."id" AND "QuestRaiseViews"."status" = 0)'
    );

    const include = [];
    const replacements = {};
    const order = [[questRaiseViewLiteral, 'asc']] as any[];
    const where = {
      [Op.and]: [],
      ...(r.query.filter && { filter: r.params.filter }),
      ...(r.params.userId && { userId: r.params.userId }),
      ...(r.params.workerId && { assignedWorkerId: r.params.workerId }),
      ...(r.query.statuses && { status: { [Op.in]: r.query.statuses } }),
      ...(r.query.priorities && { priority: { [Op.in]: r.query.priorities } }),
      ...(r.query.workplaces && { workplace: { [Op.in]: r.query.workplaces } }),
      ...(r.query.employments && { employment: { [Op.in]: r.query.employments } }),
      ...(r.query.priceBetween && { price: { [Op.between]: [r.query.priceBetween.from, r.query.priceBetween.to] } }),
    };

    if (r.query.q) {
      where[Op.or] = searchQuestFields.map(field => ({
        [field]: { [Op.iLike]: `%${r.query.q}%` }
      }));

      where[Op.or].push(userSearchLiteral)
    }
    if (requester && requester === 'worker') {
      where[Op.and].push({ userId: r.auth.credentials.id });

      include.push({
        model: QuestsResponse.unscoped(),
        as: 'invited',
        required: !!(r.query.invited), /** Because there is request without this flag */
        where: {
          [Op.and]: [{ workerId: r.auth.credentials.id }, { type: QuestsResponseType.Invite }],
        },
      }, {
        model: QuestsResponse.unscoped(),
        as: 'responded',
        required: !!(r.query.responded), /** Because there is request without this flag */
        where: {
          [Op.and]: [{ workerId: r.auth.credentials.id }, { type: QuestsResponseType.Response }],
        },
      });
    }
    if (requester && requester === 'employer') {
      where[Op.and].push({ userId: r.auth.credentials.id });
    }
    if (r.payload.specializations) { // TODO r.query.specialization on r.query.specialization[s]
      const {
        paths,
        industryKeys,
      } = SkillsFiltersController.splitPathsAndSingleKeysOfIndustry(r.payload.specializations);

      if (paths.length !== 0 && industryKeys.length === 0) {
        replacements['path'] = paths;
        where[Op.and].push(questSpecializationOnlyPathsLiteral);
      }
      if (paths.length === 0 && industryKeys.length !== 0) {
        replacements['industryKey'] = industryKeys;
        where[Op.and].push(questSpecializationOnlyIndustryKeysLiteral);
      }
      if (paths.length !== 0 && industryKeys.length !== 0) {
        replacements['path'] = paths;
        replacements['industryKey'] = industryKeys;
        where[Op.and].push(questSpecializationIndustryKeysAndPathsLiteral);
      }
    }
    if (r.query.northAndSouthCoordinates) {
      replacements['northLng'] = r.query.northAndSouthCoordinates.north.longitude;
      replacements['northLat'] = r.query.northAndSouthCoordinates.north.latitude;
      replacements['southLng'] = r.query.northAndSouthCoordinates.south.longitude;
      replacements['southLat'] = r.query.northAndSouthCoordinates.south.latitude;

      where[Op.and].push(entersAreaLiteral);
    }
    if (user.role === UserRole.Worker) {
      include.push({
        model: QuestChat.scope('idsOnly'),
        where: { workerId: user.id },
        as: 'questChat',
        required: false,
      });
    }
    if (user.role === UserRole.Employer) {
      include.push({
        model: QuestChat.scope('idsOnly'),
        as: 'questChat',
        attributes: {
          include: [[questChatLiteral, 'id']],
        },
        where: { employerId: user.id, questChatWorkerLiteral },
        required: false,
        include: {
          model: Quest.unscoped(),
          as: 'quest',
          attributes: ['id', 'status'],
          where: {
            status: [
              QuestStatus.Dispute,
              QuestStatus.Recruitment,
              QuestStatus.WaitingForConfirmFromWorkerOnAssign,
            ],
          },
          required: false,
        },
      });
    }
    if (!requester) {
      include.push({
        model: QuestsResponse.unscoped(),
        as: 'invited',
        required: false,
        where: {
          [Op.and]: [{ workerId: r.auth.credentials.id }, { type: QuestsResponseType.Invite }],
        },
      }, {
        model: QuestsResponse.unscoped(),
        as: 'responded',
        required: false,
        where: {
          [Op.and]: [{ workerId: r.auth.credentials.id }, { type: QuestsResponseType.Response }],
        },
      });
    }

    include.push({
      model: QuestsReview.unscoped(),
      as: 'yourReview',
      where: { fromUserId: r.auth.credentials.id },
      required: false,
    }, {
      model: QuestsStarred.unscoped(),
      as: 'star',
      where: { userId: r.auth.credentials.id },
      required: !!(r.query.starred), /** Because there is request without this flag */
    });

    for (const [key, value] of Object.entries(r.query.sort || {})) {
      order.push([key, value]);
    }

    // TODO !!!!
    if (type === 'list') {
      const { count, rows } = await Quest.findAndCountAll({
        distinct: true,
        limit: r.query.limit,
        offset: r.query.offset,
        include,
        order,
        where,
        replacements,
      });

      return output({ count, quests: rows });
    } else if (type === 'points') {
      const quests = await Quest.findAll({
        include, order, where, replacements,
      });

      return output({ quests });
    }
  }
}

export async function setStar(r) {
  const { questId } = r.params;
  const user: User = r.auth.credentials;

  await (await QuestControllerFactory.createById(questId))
    .setStar(user)

  return output();
}

export async function removeStar(r) {
  const { questId } = r.params;
  const user: User = r.auth.credentials;

  await (await QuestControllerFactory.createById(questId))
    .removeStar(user);

  return output();
}

export async function getAvailableQuestsForWorker(r) {
  const workerResponseLiteral = literal(
    '1 = (CASE WHEN NOT EXISTS (SELECT "QuestsResponses"."id" FROM "QuestsResponses" WHERE "QuestsResponses"."workerId"=:workerId ' +
      'AND "QuestsResponses"."questId" = "Quest"."id") THEN 1 END)'
  );

  const { workerId } = r.params;

  const workerController = await WorkerControllerFactory.createById(workerId);
  const employerController = EmployerControllerFactory.createByUserModel(r.auth.credentials);

  const { count, rows } = await Quest.findAndCountAll({
    distinct: true,
    col: '"Quest"."id"',
    where: {
      userId: employerController.user.id,
      workerResponseLiteral,
      status: QuestStatus.Recruitment,
    },
    limit: r.query.limit,
    offset: r.query.offset,
    replacements: { workerId: workerController.user.id }
  });

  return output({ count, quests: rows });
}
