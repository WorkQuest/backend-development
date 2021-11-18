import {Op, literal} from 'sequelize';
import {Errors} from '../utils/errors';
import {UserController} from "../controllers/user/controller.user";
import {QuestController} from "../controllers/quest/controller.quest";
import {transformToGeoPostGIS} from "../utils/postGIS";
import {error, output} from "../utils";
import {publishQuestNotifications, QuestNotificationActions} from "../websocket/websocket.quest";
import {QuestsResponseController} from "../controllers/quest/controller.questsResponse";
import {MediaController} from "../controllers/controller.media";
import { SkillsFiltersController } from "../controllers/controller.skillsFilters";
import {
  User,
  Quest,
  UserRole,
  QuestChat,
  QuestStatus,
  StarredQuests,
  QuestsResponse,
  QuestChatStatuses,
  QuestsResponseType,
  QuestsResponseStatus,
  QuestSpecializationFilter,
} from "@workquest/database-models/lib/models";

export const searchFields = [
  "title",
  "description",
];

export async function getQuest(r) {
  const quest = await Quest.findOne({
    where: { id: r.params.questId },
    include: [{
      model: StarredQuests,
      as: "star",
      where: { userId: r.auth.credentials.id },
      required: false
    }, {
      model: QuestsResponse,
      as: "response",
      where: { workerId: r.auth.credentials.id },
      required: false
    }]
  });

  if (!quest) {
    return error(Errors.NotFound, "Quest not found", { questId: r.params.questId });
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
    location: r.payload.location,
    title: r.payload.title,
    description: r.payload.description,
    price: r.payload.price,
    medias: r.payload.medias,
    adType: r.payload.adType,
    locationPlaceName: r.payload.locationPlaceName,
    locationPostGIS: transformToGeoPostGIS(r.payload.location),
  }, { transaction });

  const questController = new QuestController(quest);

  await questController.setMedias(medias, transaction);
  await questController.setQuestSpecializations(r.payload.specializationKeys, true, transaction);

  await transaction.commit();

  return output(
    await Quest.findByPk(quest.id)
  )
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
    location: r.payload.location,
    locationPlaceName: r.payload.locationPlaceName,
    locationPostGIS: transformToGeoPostGIS(r.payload.location),
  }, { transaction });

  await transaction.commit();

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
    .questMustHaveStatus(QuestStatus.Created, QuestStatus.WaitConfirm)

  const transaction = await r.server.app.db.transaction();

  await questController.close(transaction);

  await QuestsResponseController.closeAllResponsesOnQuest(questController.quest, transaction);

  await transaction.commit();

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

  await publishQuestNotifications(r.server, {
    data: questController.quest,
    recipients: [assignedWorkerController.user.id],
    action: QuestNotificationActions.questStarted,
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

  await publishQuestNotifications(r.server, {
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

  await publishQuestNotifications(r.server, {
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

  await publishQuestNotifications(r.server, {
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

  await publishQuestNotifications(r.server, {
    data: quest,
    recipients: [quest.assignedWorkerId],
    action: QuestNotificationActions.employerAcceptedCompletedQuest,
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

  await publishQuestNotifications(r.server, {
    data: quest,
    recipients: [quest.assignedWorkerId],
    action: QuestNotificationActions.employerRejectedCompletedQuest,
  });

  return output();
}

export async function getQuests(r) {
  const entersAreaLiteral = literal(
    'st_within("Quest"."locationPostGIS", st_makeenvelope(:northLng, :northLat, :southLng, :southLat, 4326))'
  );
  const order = [];
  const include = [];
  const where = {
    ...(r.query.statuses && { status: { [Op.in]: r.query.statuses } }),
    ...(r.query.adType && { adType: r.query.adType }),
    ...(r.query.filter && { filter: r.params.filter }),
    ...(r.params.userId && { userId: r.params.userId }),
    ...(r.query.performing && { assignedWorkerId: r.auth.credentials.id }),
    ...(r.query.north && r.query.south && { [Op.and]: entersAreaLiteral }),
    ...(r.query.priorities && { priority: {[Op.in]: r.query.priorities } }),
    ...(r.query.workplaces && { workplace: { [Op.in]: r.query.workplaces } }),
    ...(r.query.employments && { employment: { [Op.in]: r.query.employments } }),
  };

  if (r.query.q) {
    where[Op.or] = searchFields.map(field => ({
      [field]: { [Op.iLike]: `%${r.query.q}%` }
    }));
  }
  if (r.query.specializations) {
    const { specializationKeys, industryKeys } = SkillsFiltersController.splitSpecialisationAndIndustry(r.query.specializations);

    include.push({
      model: QuestSpecializationFilter,
      as: 'questIndustryForFiltering',
      attributes: [],
      where: { industryKey: { [Op.in]: industryKeys } }
    });

    if (specializationKeys.length > 0) {
      include.push({
        model: QuestSpecializationFilter,
        as: 'questSpecializationForFiltering',
        attributes: [],
        where: { specializationKey: { [Op.in]: specializationKeys } }
      });
    }
  }

  include.push({
    model: StarredQuests.unscoped(),
    as: "star",
    where: { userId: r.auth.credentials.id },
    required: r.query.starred,
  }, {
    model: QuestsResponse.unscoped(),
    as: 'invited',
    required: r.query.invited,
    where: {
      [Op.and]: [
        { workerId: r.auth.credentials.id },
        { type: QuestsResponseType.Invite },
      ]
    }
  }, {
    model: QuestsResponse.unscoped(),
    as: "responded",
    required: r.query.responded,
    where: {
      [Op.and]: [
        { workerId: r.auth.credentials.id },
        { type: QuestsResponseType.Response },
      ]
    },
  });

  // {
  //   model: QuestsResponse,
  //     as: 'responses',
  //   required: false,
  //   where: { '$"Quest"."userId"$': r.auth.credentials.id },
  // }

  for (const [key, value] of Object.entries(r.query.sort)) {
    order.push([key, value]);
  }

  const { count, rows } = await Quest.findAndCountAll({
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    include, order, where,
    replacements: {
      ...(r.query.north && r.query.south && {
        northLng: r.query.north.longitude,
        northLat: r.query.north.latitude,
        southLng: r.query.south.longitude,
        southLat: r.query.south.latitude,
      })
    }
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
