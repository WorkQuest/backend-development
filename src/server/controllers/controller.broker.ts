import { initRabbitMQ } from "../broker";
import { Buffer } from "buffer";

export const enum MainBrokerQueues {
  Chat = 'chat',
  Platform = 'platform'
}

export const enum QuestNotificationActions {
  /** Quest flow */
  questStarted = "questStarted",
  workerRejectedQuest = "workerRejectedQuest",
  workerAcceptedQuest = "workerAcceptedQuest",
  workerCompletedQuest = "workerCompletedQuest",
  employerAcceptedCompletedQuest = "employerAcceptedCompletedQuest",
  employerRejectedCompletedQuest = "employerRejectedCompletedQuest",
  /** Quest Response */
  workerRespondedToQuest = "workerRespondedToQuest",
  employerInvitedWorkerToQuest = "employerInvitedWorkerToQuest",
  workerAcceptedInvitationToQuest = "workerAcceptedInvitationToQuest",
  workerRejectedInvitationToQuest = "workerRejectedInvitationToQuest",
  employerRejectedWorkersResponse = "employerRejectedWorkersResponse",
  /** Review */
  userLeftReviewAboutQuest = "userLeftReviewAboutQuest"
}

export const enum ChatNotificationActions {
  /** Group chat */
  groupChatCreate = 'groupChatCreate',
  groupChatAddUser = 'groupChatAddUser',
  groupChatDeleteUser = 'groupChatDeleteUser',
  groupChatLeaveUser = 'groupChatLeaveUser',
  /** */
  messageReadByRecipient = 'messageReadByRecipient',
  newMessage = 'newMessage',

}

type Notification<Action> = {
  action: Action;
  data: any;
  recipients: string[]
}

export class ControllerBroker {
  private channel = initRabbitMQ();

  private convertData(data: object) {
    const stringData = JSON.stringify(data);

    return Buffer.from(stringData);
  }

  public sendQuestNotification(notification: Notification<QuestNotificationActions>) {
    const convertedData = this.convertData(notification);

    this.channel.sendToQueue(MainBrokerQueues.Platform, convertedData);
  };

  public sendChatNotification(notification: Notification<ChatNotificationActions>) {
    const convertedData = this.convertData(notification);

    this.channel.sendToQueue(MainBrokerQueues.Chat, convertedData);
  }
}

export const MessageBroker = new ControllerBroker();
