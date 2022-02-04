import { literal, Op } from "sequelize";
import { Errors } from "../utils/errors";
import { UserController } from "../controllers/user/controller.user";
import { QuestController } from "../controllers/quest/controller.quest";
import { transformToGeoPostGIS } from "../utils/postGIS";
import { error, output } from "../utils";
import { QuestNotificationActions } from "../controllers/controller.broker";
import { QuestsResponseController } from "../controllers/quest/controller.questsResponse";
import { MediaController } from "../controllers/controller.media";
import { addUpdateReviewStatisticsJob } from "../jobs/updateReviewStatistics";
import { updateQuestsStatisticJob } from "../jobs/updateQuestsStatistic";
import { SkillsFiltersController } from "../controllers/controller.skillsFilters";
import {
  DisputeStatus,
  Quest,
  QuestChat,
  QuestChatStatuses,
  QuestDispute,
  QuestsResponse,
  QuestsResponseStatus,
  QuestsResponseType,
  QuestStatus,
  Review,
  StarredQuests,
  User,
  UserRole
} from "@workquest/database-models/lib/models";

export const searchQuestFields = [
  'title',
  'description',
  'locationPlaceName'
];

export async function getQuest(r) {
  const user: User = r.auth.credentials;

  const include = [{
    model: StarredQuests,
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
    where: {
      [Op.or]: [
        { opponentUserId: r.auth.credentials.id },
        { openDisputeUserId: r.auth.credentials.id },
      ],
      status: { [Op.in]: [DisputeStatus.pending, DisputeStatus.inProgress] },
    },
    required: false,
  }, {
    model: Review.unscoped(),
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
  const employer: User = r.auth.credentials;
  const userController = new UserController(employer);

  await userController
    .userMustHaveRole(UserRole.Employer)

  const medias = await MediaController.getMedias(r.payload.medias);
  const transaction = await r.server.app.db.transaction();

  const quest = await Quest.create({
    userId: employer.id,
    status: QuestStatus.Created,
    category: r.payload.category,
    workplace: r.payload.workplace,
    employment: r.payload.employment,
    priority: r.payload.priority,
    title: r.payload.title,
    description: r.payload.description,
    price: r.payload.price,
    medias: r.payload.medias,
    adType: r.payload.adType,
    location: r.payload.locationFull.location,
    locationPlaceName: r.payload.locationFull.locationPlaceName,
    locationPostGIS: transformToGeoPostGIS(r.payload.locationFull.location),
  }, { transaction });

  const questController = new QuestController(quest);

  await questController.setMedias(medias, transaction);
  await questController.setQuestSpecializations(r.payload.specializationKeys, true, transaction);

  await transaction.commit();

  await updateQuestsStatisticJob({
    userId: employer.id,
    role: UserRole.Employer,
  });

  return output(await Quest.findByPk(quest.id));
}

export async function editQuest(r) {
  const employer: User = r.auth.credentials;

  const questController = new QuestController(await Quest.findByPk(r.params.questId));

  const medias = await MediaController.getMedias(r.payload.medias);

  questController
    .employerMustBeQuestCreator(employer.id)
    .questMustHaveStatus(QuestStatus.Created)

  const transaction = await r.server.app.db.transaction();

  await questController.setMedias(medias, transaction);
  await questController.setQuestSpecializations(r.payload.specializationKeys, false, transaction);

  questController.quest = await questController.quest.update({
    price: r.payload.price,
    title: r.payload.title,
    adType: r.payload.adType,
    priority: r.payload.priority,
    category: r.payload.category,
    workplace: r.payload.workplace,
    employment: r.payload.employment,
    description: r.payload.description,
    location: r.payload.locationFull.location,
    locationPlaceName: r.payload.locationFull.locationPlaceName,
    locationPostGIS: transformToGeoPostGIS(r.payload.locationFull.location),
  }, { transaction });

  await transaction.commit();

  const responses = await QuestsResponse.findAll({
    where: { questId: questController.quest.id, status: QuestsResponseStatus.Open },
  });

  if (responses.length !== 0) {
    r.server.app.broker.sendQuestNotification({
      action: QuestNotificationActions.questEdited,
      recipients: responses.map(_ => _.workerId),
      data: questController.quest,
    });
  }

  return output(questController.quest);
}

export async function deleteQuest(r) {
  const employer: User = r.auth.credentials;

  const questController = new QuestController(await Quest.findByPk(r.params.questId));

  questController
    .employerMustBeQuestCreator(employer.id)
    .questMustHaveStatus(QuestStatus.Created, QuestStatus.Closed)

  const transaction = await r.server.app.db.transaction();

  await questController.destroy(transaction);

  await transaction.commit();

  return output();
}

export async function closeQuest(r) {
  const employer: User = r.auth.credentials;

  const questController = new QuestController(await Quest.findByPk(r.params.questId));

  await questController
    .employerMustBeQuestCreator(employer.id)
    .questMustHaveStatus(QuestStatus.Created)

  const transaction = await r.server.app.db.transaction();

  await questController.close(transaction);

  await QuestsResponseController.closeAllResponsesOnQuest(questController.quest, transaction);

  await transaction.commit();

  await updateQuestsStatisticJob({
    userId: employer.id,
    role: UserRole.Employer,
  });

  return output();
}

export async function startQuest(r) {
  const employer: User = r.auth.credentials;

  const questController = new QuestController(await Quest.findByPk(r.params.questId));
  const assignedWorkerController = new UserController(await User.findByPk(r.payload.assignedWorkerId));

  await questController
    .employerMustBeQuestCreator(employer.id)
    .questMustHaveStatus(QuestStatus.Created)

  const questsResponseController = new QuestsResponseController(await QuestsResponse.findOne({
    where: { workerId: assignedWorkerController.user.id, questId: questController.quest.id },
  }));

  questsResponseController
    .checkActiveResponse()

  const transaction = await r.server.app.db.transaction();

  await questController.start(assignedWorkerController.user, transaction);
  await questsResponseController.closeOtherResponsesToQuest(questController.quest, transaction);

  await QuestChat.update({ status: QuestChatStatuses.Close }, {
    where: { questId: questController.quest.id, workerId: { [Op.ne]: assignedWorkerController.user.id } }, transaction,
  });

  await transaction.commit();

  r.server.app.broker.sendQuestNotification({
    data: questController.quest,
    recipients: [assignedWorkerController.user.id],
    action: QuestNotificationActions.waitWorker,
  });

  return output();
}

export async function rejectWorkOnQuest(r) {
  const worker: User = r.auth.credentials;
  const workerController = new UserController(worker);

  const questController = new QuestController(await Quest.findByPk(r.params.questId));

  workerController.
    userMustHaveRole(UserRole.Worker)

  questController
    .questMustHaveStatus(QuestStatus.WaitWorker)
    .workerMustBeAppointedOnQuest(worker.id)

  const transaction = await r.server.app.db.transaction();

  await questController.answerWorkOnQuest(worker, false, transaction);
  await QuestsResponseController.reopenQuestResponses(questController.quest, worker, transaction);

  await transaction.commit();

  r.server.app.broker.sendQuestNotification({
    recipients: [questController.quest.userId],
    action: QuestNotificationActions.workerRejectedQuest,
    data: questController.quest,
  });

  return output();
}

export async function acceptWorkOnQuest(r) {
  const worker: User = r.auth.credentials;
  const workerController = new UserController(worker);

  const questController = new QuestController(await Quest.findByPk(r.params.questId));

  workerController.
    userMustHaveRole(UserRole.Worker)

  questController
    .questMustHaveStatus(QuestStatus.WaitWorker)
    .workerMustBeAppointedOnQuest(worker.id)

  const transaction = await r.server.app.db.transaction();

  // TODO Quest Responses?
  await questController.answerWorkOnQuest(worker, true, transaction);

  await transaction.commit();

  await updateQuestsStatisticJob({
    userId: worker.id,
    role: UserRole.Worker,
  });

  r.server.app.broker.sendQuestNotification({
    data: questController.quest,
    recipients: [questController.quest.userId],
    action: QuestNotificationActions.workerAcceptedQuest,
  });

  return output();
}

export async function completeWorkOnQuest(r) {
  const worker: User = r.auth.credentials;

  const quest: Quest = await Quest.findByPk(r.params.questId);
  const questController = new QuestController(quest);

  questController
    .questMustHaveStatus(QuestStatus.Active)
    .workerMustBeAppointedOnQuest(worker.id)

  await questController.completeWork();

  r.server.app.broker.sendQuestNotification({
    data: questController.quest,
    recipients: [questController.quest.userId],
    action: QuestNotificationActions.workerCompletedQuest,
  });

  return output();
}

export async function acceptCompletedWorkOnQuest(r) {
  const employer: User = r.auth.credentials;

  const quest = await Quest.findByPk(r.params.questId);
  const questController = new QuestController(quest);

  questController
    .employerMustBeQuestCreator(employer.id)
    .questMustHaveStatus(QuestStatus.WaitConfirm)

  await questController.approveCompletedWork();

  r.server.app.broker.sendQuestNotification({
    data: quest,
    recipients: [quest.assignedWorkerId],
    action: QuestNotificationActions.employerAcceptedCompletedQuest,
  });

  await addUpdateReviewStatisticsJob({
    userId: quest.userId,
  });
  await addUpdateReviewStatisticsJob({
    userId: quest.assignedWorkerId,
  });

  await updateQuestsStatisticJob({
    userId: quest.assignedWorkerId,
    role: UserRole.Worker,
  });
  await updateQuestsStatisticJob({
    userId: employer.id,
    role: UserRole.Employer,
  });

  return output();
}

export async function rejectCompletedWorkOnQuest(r) {
  const employer: User = r.auth.credentials;

  const quest = await Quest.findByPk(r.params.questId);
  const questController = new QuestController(quest);

  questController
    .employerMustBeQuestCreator(employer.id)
    .questMustHaveStatus(QuestStatus.WaitConfirm)

  await questController.rejectCompletedWork();

  r.server.app.broker.sendQuestNotification({
    data: quest,
    recipients: [quest.assignedWorkerId],
    action: QuestNotificationActions.employerRejectedCompletedQuest,
  });

  return output();
}

export async function getQuests(r) {
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

  const order = [];
  const include = [];
  const replacements = {};
  const where = {
    [Op.and]: [],
    ...(r.query.adType && { adType: r.query.adType }),
    ...(r.query.filter && { filter: r.params.filter }),
    ...(r.params.userId && { userId: r.params.userId }),
    ...(r.params.workerId && { assignedWorkerId: r.params.workerId }),
    ...(r.query.statuses && { status: { [Op.in]: r.query.statuses } }),
    ...(r.query.performing && { assignedWorkerId: r.auth.credentials.id }),
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
  if (r.query.specializations) { // TODO r.query.specialization on r.query.specialization[s]
    const { paths, industryKeys } = SkillsFiltersController.splitPathsAndSingleKeysOfIndustry(r.query.specializations);

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
          status: [QuestStatus.Active, QuestStatus.Dispute, QuestStatus.WaitWorker, QuestStatus.WaitConfirm],
        },
        required: false,
      },
    });
  }

  include.push(
    {
      model: Review.unscoped(),
      as: 'yourReview',
      where: { fromUserId: r.auth.credentials.id },
      required: false,
    },
    {
      model: StarredQuests.unscoped(),
      as: 'star',
      where: { userId: r.auth.credentials.id },
      required: r.query.starred,
    },
    {
      model: QuestsResponse.unscoped(),
      as: 'invited',
      required: r.query.invited,
      where: {
        [Op.and]: [{ workerId: r.auth.credentials.id }, { type: QuestsResponseType.Invite }],
      },
    },
    {
      model: QuestsResponse.unscoped(),
      as: 'responded',
      required: r.query.responded,
      where: {
        [Op.and]: [{ workerId: r.auth.credentials.id }, { type: QuestsResponseType.Response }],
      },
    },
  );

  for (const [key, value] of Object.entries(r.query.sort)) {
    order.push([key, value]);
  }

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
}

export async function setStar(r) {
  const user: User = r.auth.credentials;
  const questController = new QuestController(await Quest.findByPk(r.params.questId));

  await questController.setStar(user);

  return output();
}

export async function removeStar(r) {
  const user: User = r.auth.credentials;
  const questController = new QuestController(await Quest.findByPk(r.params.questId));

  await questController.removeStar(user);

  return output();
}

export async function getAvailableQuestsForWorker(r) {
  const employer: User = r.auth.credentials;
  const employerController = new UserController(employer);

  employerController
    .userMustHaveRole(UserRole.Employer)

  const { count, rows } = await Quest.findAndCountAll({
    where: { userId: r.auth.credentials.id },
    include: [{
      model: QuestsResponse,
      as: 'response',
      where: { workerId: { [Op.not]: r.params.workerId } },
      required: true,
    }]
  });

  return output({ count, quests: rows });
}

