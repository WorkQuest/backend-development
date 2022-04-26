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
  waitWorker = 'WaitWorker',
  questEdited = 'QuestEdited',
  questEndSoon = 'QuestEndSoon',
  workerRejectedQuest = 'WorkerRejectedQuest',
  workerAcceptedQuest = 'WorkerAcceptedQuest',
  workerCompletedQuest = 'WorkerCompletedQuest',
  employerAcceptedCompletedQuest = 'EmployerAcceptedCompletedQuest',
  employerRejectedCompletedQuest = 'EmployerRejectedCompletedQuest',
  /** Quest Response */
  workerRespondedToQuest = 'WorkerRespondedToQuest',
  employerInvitedWorkerToQuest = 'EmployerInvitedWorkerToQuest',
  workerAcceptedInvitationToQuest = 'WorkerAcceptedInvitationToQuest',
  workerRejectedInvitationToQuest = 'WorkerRejectedInvitationToQuest',
  employerRejectedWorkersResponse = 'EmployerRejectedWorkersResponse',
  /** Review */
  userLeftReviewAboutQuest = 'UserLeftReviewAboutQuest',
  /** Dispute */
  openDispute = 'OpenDispute',
}

export const enum ChatNotificationActions {
  /** Group chat */
  groupChatCreate = 'GroupChatCreate',
  groupChatAddUser = 'GroupChatAddUser',
  groupChatDeleteUser = 'GroupChatDeleteUser',
  groupChatLeaveUser = 'GroupChatLeaveUser',
  /** */
  messageReadByRecipient = 'MessageReadByRecipient',
  newMessage = 'NewMessage',
}

export const enum DaoNotificationActions {
  /** Discussions */
  newDiscussionLike = 'NewDiscussionLike',
  newCommentInDiscussion = 'NewCommentInDiscussion',
  commentLiked = 'CommentLiked',
  replyToComment = 'ReplyToComment',
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
