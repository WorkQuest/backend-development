import { col, fn, literal, Op } from 'sequelize';
import { Errors } from '../utils/errors';
import { QuestController } from '../controllers/quest/controller.quest';
import { error, output } from '../utils';
import { ChecksListQuest } from '../checks-list/checksList.quest';
import { ChecksListUser } from '../checks-list/checksList.user';
import { QuestNotificationActions } from '../controllers/controller.broker';
import { MediaController } from '../controllers/controller.media';
import { updateQuestsStatisticJob } from '../jobs/updateQuestsStatistic';
import { SkillsFiltersController } from '../controllers/controller.skillsFilters';
import { EmployerControllerFactory, WorkerControllerFactory } from '../factories/factory.userController';
import { QuestControllerFactory } from '../factories/factory.questController';
import { QuestStatisticController } from '../controllers/statistic/controller.questStatistic';
import {
  DisputeStatus,
  Quest,
  QuestChat,
  QuestDispute,
  QuestsResponse,
  QuestsResponseStatus,
  QuestsResponseType,
  QuestChatStatus,
  QuestsReview,
  QuestsStarred,
  QuestStatus,
  User,
  UserRole,
  PayPeriod,
  LocationType, WorkPlace
} from "@workquest/database-models/lib/models";
import { CreateQuestComposHandler } from '../handlers/compositions/quest/CreateQuestComposHandler';
import { Priority, QuestEmployment } from '@workquest/database-models/src/models';
import { EditQuestComposHandler } from "../handlers/compositions/quest";
import { MarkQuestStarHandler } from "../handlers/quest/star/MarkQuestStarHandler";
import { MarkQuestStarComposHandler } from "../handlers/compositions/quest/MarkQuestStarComposHandler";


export const searchQuestFields = [
  'title',
  'description',
  'locationPlaceName'
];

export async function getQuest(r) {
  const user: User = r.auth.credentials;

  const bind = {};

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
    as: 'assignedWorker',
  }, {
    model: QuestDispute.unscoped(),
    as: 'openDispute',
    attributes: ["id", "status"],
    where: {
      [Op.or]: [
        { opponentUserId: r.auth.credentials.id },
        { openDisputeUserId: r.auth.credentials.id },
      ],
      status: { [Op.in]: [DisputeStatus.Pending, DisputeStatus.Created, DisputeStatus.InProgress] },
    },
    required: false,
  }, {
    model: QuestsReview,
    as: 'yourReview',
    where: { fromUserId: r.auth.credentials.id },
    required: false,
  }] as any[];

  if (user.role === UserRole.Worker) {
    include.push({
      model: QuestChat.unscoped(),
      attributes: ["chatId"],
      as: 'questChat',
      required: false,
      where: { workerId: user.id },
    });
  }

  if (user.role === UserRole.Employer) {
    const excludeStatuses = [
      QuestStatus.Closed,
      QuestStatus.Dispute,
      QuestStatus.Blocked,
      QuestStatus.Pending,
      QuestStatus.Recruitment,
      QuestStatus.WaitingForConfirmFromWorkerOnAssign,
    ];

    include.push({
      model: QuestChat.scope('forQuestChat'),
      attributes: {
        include: [[literal('CASE WHEN "questChat"."chatId" IS NULL THEN NULL ELSE "chatId" END'), 'chatId']],
        exclude: ['createdAt', 'updatedAt', 'status', 'id'],
      },
      as: 'questChat',
      required: false,
      where: literal(
        `"questChat"."employerId" = $employerId AND "Quest"."status" NOT IN (${excludeStatuses.join(',')}) AND "questChat"."status" = ${
          QuestChatStatus.Open
        }`,
      ),
    });

    bind['employerId'] = r.auth.credentials.id;
  }

  const quest = await Quest.findOne({
    where: { id: r.params.questId },
    bind,
    include,
  });

  if (!quest) {
    return error(Errors.NotFound, 'Quest not found', { questId: r.params.questId });
  }

  return output(quest);
}

export async function createQuest(r) {
  const userId = r.auth.credentials.id;

  const quest = await new CreateQuestComposHandler(r.server.app.db).Handle({
    questCreatorId: userId,
    workplace: r.payload.workplace,
    payPeriod: r.payload.payPeriod,
    typeOfEmployment: r.payload.typeOfEmployment,
    priority: r.payload.priority,
    title: r.payload.title,
    description: r.payload.description,
    price: r.payload.price,
    mediaIds: r.payload.medias,

    locationFull: r.payload.locationFull,

    specializationKeys: r.payload.specializationKeys,
  });

  await updateQuestsStatisticJob({
    userId,
    role: UserRole.Employer,
  });

  await QuestStatisticController.createQuestAction(quest.price);

  return output(quest);
}

export async function editQuest(r) {
  const quest = await new EditQuestComposHandler(r.server.app.db)
    .Handle({
      questId: r.params.questId,
      mediaIds: r.payload.medias,
      priority: r.payload.priority,
      payPeriod: r.payload.payPeriod,
      workplace: r.payload.workplace,
      questCreator: r.auth.credentials,
      locationFull: r.payload.locationFull,
      typeOfEmployment: r.payload.typeOfEmployment,
      specializationKeys: r.payload.specializationKeys,
    });

  const questsResponseWorkerIds = await QuestsResponse.unscoped().findAll({
    attributes: [[fn('array_agg', col('"workerId"')), 'workerIds'], 'type'],
    where: {
      questId: quest.id,
      status: QuestsResponseStatus.Open,
    },
    group: ['type'],
    order: [['type', 'ASC']],
  });

  if (questsResponseWorkerIds.length !== 0) {
    for (const response of questsResponseWorkerIds) {
      r.server.app.broker.sendQuestNotification({
        action: QuestNotificationActions.questEdited,
        recipients: response.getDataValue('workerIds'),
        data: { ...quest.toJSON(), responseType: response.type },
      });
    }
  }

  return output(quest);
}

// TODO отрефракторить!
export function getQuests(type: 'list' | 'points', requester?: 'worker' | 'employer') {
  return async function(r) {
    const user: User = r.auth.credentials;
    const checksListUser = new ChecksListUser(user);

    const entersAreaLiteral = literal(
      'st_within("Quest"."locationPostGIS", st_makeenvelope(:northLng, :northLat, :southLng, :southLat, 4326))'
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
    const requesterWorkerLiteral = literal(
      `(1 = (CASE WHEN EXISTS (SELECT * FROM "QuestsResponses" as qResp ` +
      `WHERE qResp."questId" = "Quest"."id" AND (qResp."workerId"  = '${ user.id }' AND ` +
        `qResp."status" IN (${ QuestsResponseStatus.Open }, ${ QuestsResponseStatus.Accepted }))) THEN 1 END)) `
    )

    const include = [];
    const replacements = {};
    const order = [[questRaiseViewLiteral, 'asc']] as any[];
    const where = {
      [Op.and]: [],
      [Op.or]: [],
      ...(r.query.filter && { filter: r.params.filter }),
      ...(r.params.userId && { userId: r.params.userId }),
      ...(r.params.workerId && { assignedWorkerId: r.params.workerId }),
      ...(r.query.statuses && { status: { [Op.in]: r.query.statuses } }),
      ...(r.query.priorities && { priority: { [Op.in]: r.query.priorities } }),
      ...(r.query.workplaces && { workplace: { [Op.in]: r.query.workplaces } }),
      ...(r.query.typeOfEmployments && { typeOfEmployment: { [Op.in]: r.query.typeOfEmployments } }),
      ...(r.query.priceBetween && { price: { [Op.between]: [r.query.priceBetween.from, r.query.priceBetween.to] } }),
      ...(r.query.payPeriods && { payPeriod: { [Op.in]: r.query.payPeriods } }),
    };

    if (r.query.q) {
      where[Op.or].push(searchQuestFields.map(field => ({
        [field]: { [Op.iLike]: `%${r.query.q}%` }
      })));

      where[Op.or].push(userSearchLiteral);
    }
    if (requester && requester === 'worker') {
      checksListUser
        .checkUserRole(UserRole.Worker)

      if (!(r.query.responded || r.query.invited)) {
        where[Op.or].push(
          requesterWorkerLiteral,
          { assignedWorkerId: r.auth.credentials.id },
        );
      }
    }
    if (requester && requester === 'employer') {
      checksListUser
        .checkUserRole(UserRole.Employer)

      where[Op.and].push({ userId: user.id });
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
        model: QuestChat.unscoped(),
        attributes: ["chatId"],
        where: { workerId: user.id },
        as: 'questChat',
        required: false,
      });
    }
    if (user.role === UserRole.Employer) {
      include.push({
        model: QuestChat.unscoped(),
        as: 'questChat',
        attributes: ["chatId"],
        where: { employerId: user.id, questChatWorkerLiteral },
        required: false,
      });
    }

    include.push({
      model: QuestsReview.unscoped(),
      as: 'yourReview',
      where: { fromUserId: user.id },
      required: false,
    }, {
      model: QuestsStarred.unscoped(),
      as: 'star',
      where: { userId: user.id },
      required: !!(r.query.starred), /** Because there is request without this flag */
    }, {
      model: QuestsResponse.unscoped(),
      as: 'invited',
      required: !!(r.query.invited),
      where: {
        [Op.and]: [{ workerId: user.id }, { type: QuestsResponseType.Invite }],
        status: {[Op.in]: [QuestsResponseStatus.Open, QuestsResponseStatus.Accepted]}
      },
    }, {
      model: QuestsResponse.unscoped(),
      as: 'responded',
      required: !!(r.query.responded),
      where: {
        [Op.and]: [{ workerId: user.id }, { type: QuestsResponseType.Response }],
        status: {[Op.in]: [QuestsResponseStatus.Open, QuestsResponseStatus.Accepted]}
      },
    });

    for (const [key, value] of Object.entries(r.query.sort || {})) {
      order.push([key, value]);
    }

    if (where[Op.or].length === 0) {
      delete where[Op.or];
    }
    if (where[Op.and].length === 0) {
      delete where[Op.and];
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
        include,
        order,
        where,
        replacements,
      });

      return output({ quests });
    }
  };
}

export async function setStar(r) {
  const { questId } = r.params;
  const meUser: User = r.auth.credentials;

  await new MarkQuestStarComposHandler(r.server.app.db).Handle({
    questId,
    meUser,
  });

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
      'AND "QuestsResponses"."questId" = "Quest"."id") THEN 1 END)',
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
    replacements: { workerId: workerController.user.id },
  });

  return output({ count, quests: rows });
}
