import { error, output } from "../utils";
import { Errors } from "../utils/errors";
import { QuestController } from "../controllers/controller.quest";
import { UserController } from "../controllers/controller.user";
import {
  User,
  UserRole,
  Quest,
  QuestStatus,
  QuestsResponse,
  QuestsResponseStatus,
  QuestsResponseType,
  QuestChat,
  Chat,
  ChatType,
  Message,
  MessageType,
  ChatMember,
  InfoMessage,
  MessageAction, QuestChatStatuses
} from "@workquest/database-models/lib/models";

export async function responseOnQuest(r) {
  const worker: User = r.auth.credentials;
  const workerController = new UserController(worker.id, worker);
  const questController = new QuestController(r.params.questId);
  const quest = await questController.findModel();

  await questController.questMustHaveStatus(QuestStatus.Created);
  await workerController.userMustHaveRole(UserRole.Worker);

  const questsResponse = await QuestsResponse.findOne({
    where: {
      questId: quest.id,
      workerId: worker.id,
    }
  });

  if (questsResponse) {
    return error(Errors.AlreadyAnswer, "You already answered quest", { questsResponse });
  }

  const transaction = await r.server.app.db.transaction();

  const response = QuestsResponse.build({
    workerId: worker.id,
    questId: quest.id,
    message: r.payload.message,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Response,
  }, transaction);

  const chat = Chat.build({
    type: ChatType.quest,
  },  transaction );

  const message = Message.build({
    senderUserId: worker.id,
    chatId: chat.id,
    type: MessageType.info,
    createdAt: Date.now(),
  }, transaction);

  chat.lastMessageId = message.id;
  chat.lastMessageDate = message.createdAt;

  const infoMessage = InfoMessage.build({
    messageId: message.id,
    messageAction: MessageAction.questChatCreate,
  });

   const questChat = QuestChat.build({
    employerId: quest.userId ,
    workerId: worker.id,
    questId: quest.id,
    responseId: response.id,
    chatId: chat.id,
  }, transaction);

  const members = ChatMember.bulkBuild([{
    unreadCountMessages: 0, /** Because created */
    chatId: chat.id,
    userId: r.auth.credentials.id,
    lastReadMessageId: message.id, /** Because created,  */
    lastReadMessageNumber: message.number,
  }, {
    unreadCountMessages: 1, /** Because created */
    chatId: chat.id,
    userId: quest.userId,
    lastReadMessageId: null, /** Because created */
    lastReadMessageNumber: null,
  }], transaction );

  await Promise.all([
    response.save({ transaction }),
    chat.save({ transaction }),
    message.save({ transaction }),
    infoMessage.save({ transaction }),
    members.map(member => member.save({ transaction })),
    questChat.save({ transaction }),
  ]);

  await transaction.commit();

  return output();
}

export async function inviteOnQuest(r) {
  const employer: User = r.auth.credentials;
  const invitedWorkerController = new UserController(r.payload.invitedUserId);
  const employerController = new UserController(employer.id, employer);
  const invitedWorker = await invitedWorkerController.findModel();
  const questController = new QuestController(r.params.questId);
  const quest = await questController.findModel();

  await employerController.userMustHaveRole(UserRole.Employer);
  await invitedWorkerController.userMustHaveRole(UserRole.Worker);

  await questController.questMustHaveStatus(QuestStatus.Created);
  await questController.employerMustBeQuestCreator(employer.id);

  const questResponse = await QuestsResponse.findOne({
    where: { questId: quest.id, workerId: invitedWorker.id }
  });

  if (questResponse) {
    return error(Errors.AlreadyAnswer, "You already answered quest", { questResponse });
  }

  const transaction = await r.server.app.db.transaction();

  const response = QuestsResponse.build({
    workerId: invitedWorker.id,
    questId: quest.id,
    message: r.payload.message,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Invite,
  }, transaction);

  const chat = Chat.build({
    type: ChatType.quest,
  }, transaction);

  const message = Message.build({
    senderUserId: employer.id,
    chatId: chat.id,
    type: MessageType.info,
    createdAt: Date.now(),
  }, transaction);

  chat.lastMessageId = message.id;
  chat.lastMessageDate = message.createdAt;

  const infoMessage = InfoMessage.build({
    messageId: message.id,
    messageAction: MessageAction.questChatCreate,
  });

  const members = ChatMember.bulkBuild([{
    unreadCountMessages: 0, /** Because created */
    chatId: chat.id,
    userId: r.auth.credentials.id,
    lastReadMessageId: message.id, /** Because created,  */
    lastReadMessageNumber: message.number,
  }, {
    unreadCountMessages: 1, /** Because created */
    chatId: chat.id,
    userId: invitedWorker.id,
    lastReadMessageId: null, /** Because created */
    lastReadMessageNumber: null,
  }], transaction);

  const questChat = QuestChat.build({
    employerId: quest.userId ,
    workerId: invitedWorker.id,
    questId: quest.id,
    responseId: response.id,
    chatId: chat.id,
  }, transaction);

  await Promise.all([
    response.save({ transaction }),
    chat.save({ transaction }),
    message.save({ transaction }),
    infoMessage.save({ transaction }),
    members.map( member => member.save({ transaction }) ),
    questChat.save({ transaction }),
  ]);

  await transaction.commit();

  return output();
}

export async function userResponsesToQuest(r) {
  const employer: User = r.auth.credentials;
  const questController = new QuestController(r.params.questId);
  const quest = await questController.findModel();

  await questController.employerMustBeQuestCreator(employer.id);

  const { rows, count } = await QuestsResponse.findAndCountAll({
    where: { questId: quest.id },
  });

  return output({ count, responses: rows });
}

export async function responsesToQuestsForUser(r) {
  const worker: User = r.auth.credentials;
  const workerController = new UserController(worker.id, worker);

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
  const questsResponse = await QuestsResponse.findOne({ where: { id: r.params.responseId } });

  if (!questsResponse) {
    return error(Errors.NotFound, "Quests response not found", {});
  }

  questsResponse.mustBeInvitedToQuest(worker.id);
  questsResponse.mustHaveType(QuestsResponseType.Invite);
  questsResponse.mustHaveStatus(QuestsResponseStatus.Open);

  await questsResponse.update({ status: QuestsResponseStatus.Accepted });

  return output();
}

export async function rejectInviteOnQuest(r) {
  const worker: User = r.auth.credentials;
  const questsResponse = await QuestsResponse.findOne({ where: { id: r.params.responseId } });

  if (!questsResponse) {
    return error(Errors.NotFound, "Quests response not found", {});
  }

  await QuestChat.update({ status: QuestChatStatuses.Close }, { where: {responseId: r.params.responseId } });

  questsResponse.mustBeInvitedToQuest(worker.id);
  questsResponse.mustHaveType(QuestsResponseType.Invite);
  questsResponse.mustHaveStatus(QuestsResponseStatus.Open);

  await questsResponse.update({ status: QuestsResponseStatus.Rejected });

  return output();
}

export async function rejectResponseOnQuest(r) {
  const employer: User = r.auth.credentials;
  const questsResponse = await QuestsResponse.findOne({ where: { id: r.params.responseId } });

  if (!questsResponse) {
    return error(Errors.NotFound, "Quests response not found", {});
  }

  const questController = new QuestController(questsResponse.questId);

  await questController.findModel();

  await questController.employerMustBeQuestCreator(employer.id);
  questsResponse.mustHaveType(QuestsResponseType.Response);
  questsResponse.mustHaveStatus(QuestsResponseStatus.Open);

  await questsResponse.update({ status: QuestsResponseStatus.Rejected });

  await QuestChat.update({ status: QuestChatStatuses.Close }, { where: {responseId: r.params.responseId } });

  return output();
}
