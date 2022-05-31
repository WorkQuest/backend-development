import { Buffer } from 'buffer';
import config from '../config/config';
import amqp from 'amqplib/callback_api';

export const enum MainBrokerQueues {
  Chat = 'chat',
  Quest = 'quest',
  DAO = 'dao'
}

export const enum QuestNotificationActions {
  /** Quest flow */
  waitWorker = 'waitWorker',
  questEdited = 'questEdited',
  questEndSoon = 'questEndSoon',
  workerRejectedQuest = 'workerRejectedQuest',
  workerAcceptedQuest = 'workerAcceptedQuest',
  workerCompletedQuest = 'workerCompletedQuest',
  employerAcceptedCompletedQuest = 'employerAcceptedCompletedQuest',
  employerRejectedCompletedQuest = 'employerRejectedCompletedQuest',
  /** Quest Response */
  workerRespondedToQuest = 'workerRespondedToQuest',
  employerInvitedWorkerToQuest = 'employerInvitedWorkerToQuest',
  workerAcceptedInvitationToQuest = 'workerAcceptedInvitationToQuest',
  workerRejectedInvitationToQuest = 'workerRejectedInvitationToQuest',
  employerRejectedWorkersResponse = 'employerRejectedWorkersResponse',
  /** Review */
  userLeftReviewAboutQuest = 'userLeftReviewAboutQuest',
  /** Dispute */
  openDispute = 'openDispute',
}

export const enum ChatNotificationActions {
  /** Group group-chat */
  groupChatCreate = 'groupChatCreate',
  groupChatAddUser = 'groupChatAddUser',
  groupChatDeleteUser = 'groupChatDeleteUser',
  groupChatLeaveUser = 'groupChatLeaveUser',
  /** */
  messageReadByRecipient = 'messageReadByRecipient',
  newMessage = 'newMessage',
}

export const enum DaoNotificationActions {
  /** Discussions */
  newDiscussionLike = 'newDiscussionLike',
  newCommentInDiscussion = 'newCommentInDiscussion',
  commentLiked = 'commentLiked',
  replyToComment = 'replyToComment',
  /** Proposal */
}

type Notification<Action> = {
  action: Action;
  data: any;
  recipients: string[];
  delay?: number;
};

export class ControllerBroker {
  private channel;

  constructor() {
    this.initMessageBroker();
  }

  private initMessageBroker() {
    amqp.connect(config.notificationMessageBroker.link, (connectError, conn) => {
      if (connectError) {
        console.error(connectError.message);
        return;
      }

      conn.on('error', (connectionError) => {
        console.error(connectionError.message);
      });

      conn.on('close', () => {
        setTimeout(() => {
          this.initMessageBroker();
        }, 5000);
      });

      conn.createChannel((channelError, channel) => {
        if (channelError) {
          console.error(channelError.message);
        }

        this.channel = channel;
      });

      console.log('Message broker connected');
    });
  }

  public static convertData(data: object) {
    const stringData = JSON.stringify(data);

    return Buffer.from(stringData);
  }

  public sendQuestNotification(notification: Notification<QuestNotificationActions>) {
    if (!this.channel) return;

    const convertedData = ControllerBroker.convertData(notification);

    this.channel.sendToQueue(MainBrokerQueues.Quest, convertedData);
  }

  public sendChatNotification(notification: Notification<ChatNotificationActions>) {
    if (!this.channel) return;

    const convertedData = ControllerBroker.convertData(notification);

    this.channel.sendToQueue(MainBrokerQueues.Chat, convertedData);
  }

  public sendDaoNotification(notification: Notification<DaoNotificationActions>) {
    if (!this.channel) return;

    const convertedData = ControllerBroker.convertData(notification);

    this.channel.sendToQueue(MainBrokerQueues.DAO, convertedData);
  }
}
