
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

const questSubscriptionFilter = async function (path, notification, options): Promise<boolean> {
  return options.credentials ? notification.recipients.includes(options.credentials.id) : false;
}

export const questSubscriptionOption = {
  subscription: "/notifications/quest",
  option: { filter: questSubscriptionFilter },
}

export async function publishQuestNotifications(server, event: { recipients: string[], action: QuestNotificationActions, data: any } ) {
  return server.publish(questSubscriptionOption.subscription, event);
}
