import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { QuestController } from "../controllers/quest/controller.quest";
import { UserController } from "../controllers/controller.user";
import {
  User,
  UserRole,
  Quest,
  QuestStatus,
  QuestsResponse,
  QuestsResponseStatus,
  QuestsResponseType,
} from "@workquest/database-models/lib/models";
import { QuestsResponseController } from "../controllers/quest/controller.questsResponse";

export async function responseOnQuest(r) {
  const worker: User = r.auth.credentials;

  const workerController = new UserController(worker);
  const questController = await QuestController.makeControllerByModelPromise(
    Quest.findByPk(r.params.questId)
  );

  await questController.questMustHaveStatus(QuestStatus.Created);
  await workerController.userMustHaveRole(UserRole.Worker);

  const questsResponse = await QuestsResponse.findOne({
    where: {
      questId: questController.quest.id,
      workerId: worker.id,
    }
  });

  if (questsResponse) {
    return error(Errors.AlreadyAnswer, "You already answered quest", { questsResponse });
  }

  await QuestsResponse.create({
    workerId: worker.id,
    questId: questController.quest.id,
    message: r.payload.message,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Response,
  });

  return output();
}

export async function inviteOnQuest(r) {
  const employer: User = r.auth.credentials;
  const employerController = new UserController(employer);

  const invitedWorkerController = await UserController.makeControllerByModelPromise(
    User.findByPk(r.payload.invitedUserId)
  );
  const questController = await QuestController.makeControllerByModelPromise(
    Quest.findByPk(r.params.questId)
  );

  await employerController.userMustHaveRole(UserRole.Employer);
  await invitedWorkerController.userMustHaveRole(UserRole.Worker);

  await questController.questMustHaveStatus(QuestStatus.Created);
  await questController.employerMustBeQuestCreator(employer.id);

  const questResponse = await QuestsResponse.findOne({
    where: { questId: questController.quest.id, workerId: invitedWorkerController.user.id }
  });

  if (questResponse) {
    return error(Errors.AlreadyAnswer, "You already answered quest", { questResponse });
  }

  await QuestsResponse.create({
    workerId: invitedWorkerController.user.id,
    questId: questController.quest.id,
    message: r.payload.message,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Invite,
  });

  return output();
}

export async function userResponsesToQuest(r) {
  const employer: User = r.auth.credentials;

  const questController = await QuestController.makeControllerByModelPromise(
    Quest.findByPk(r.params.questId)
  );

  await questController.employerMustBeQuestCreator(employer.id);

  const { rows, count } = await QuestsResponse.findAndCountAll({
    where: { questId: questController.quest.id },
  });

  return output({ count, responses: rows });
}

export async function responsesToQuestsForUser(r) {
  const worker: User = r.auth.credentials;
  const workerController = new UserController(worker);

  await workerController.userMustHaveRole(UserRole.Worker);

  const { rows, count } = await QuestsResponse.findAndCountAll({
    where: { workerId: worker.id },
    include: [{
      model: Quest,
      as: 'quest'
    }]
  });

  return output({ count, responses: rows });
}

export async function acceptInviteOnQuest(r) {
  const worker: User = r.auth.credentials;

  const questsResponseController = await QuestsResponseController.makeControllerByModelPromise(
    QuestsResponse.findByPk(r.params.responseId)
  );

  await questsResponseController.workerMustBeInvitedToQuest(worker.id);
  await questsResponseController.questsResponseMustHaveType(QuestsResponseType.Invite);
  await questsResponseController.questsResponseMustHaveStatus(QuestsResponseStatus.Open);

  await questsResponseController.questsResponse.update({ status: QuestsResponseStatus.Accepted });

  return output();
}

export async function rejectInviteOnQuest(r) {
  const worker: User = r.auth.credentials;

  const questsResponseController = await QuestsResponseController.makeControllerByModelPromise(
    QuestsResponse.findByPk(r.params.responseId)
  );

  await questsResponseController.workerMustBeInvitedToQuest(worker.id);
  await questsResponseController.questsResponseMustHaveType(QuestsResponseType.Invite);
  await questsResponseController.questsResponseMustHaveStatus(QuestsResponseStatus.Open);

  await questsResponseController.questsResponse.update({ status: QuestsResponseStatus.Rejected });

  return output();
}

export async function rejectResponseOnQuest(r) {
  const employer: User = r.auth.credentials;

  const questsResponseController = await QuestsResponseController.makeControllerByModelPromise(
    QuestsResponse.findByPk(r.params.responseId, { include: { model: Quest, as: 'quest' } })
  );

  const questController = new QuestController(questsResponseController.questsResponse.quest); // TODO проверить

  await questController.employerMustBeQuestCreator(employer.id);
  await questsResponseController.questsResponseMustHaveType(QuestsResponseType.Response);
  await questsResponseController.questsResponseMustHaveStatus(QuestsResponseStatus.Open);

  await questsResponseController.questsResponse.update({ status: QuestsResponseStatus.Rejected });

  return output();
}
