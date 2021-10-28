export const enum QuestNotificationActions {
  questStarted = "questStarted",

}

const questRequestManager = async function (path, notification, options): Promise<boolean> {
  return notification.recipients.includes(options.credentials.id);
}

export const questSubscriptionOption = {
  subscription: "/notifications/quest",
  requestManager: questRequestManager,
}

export async function publishQuestNotifications(server, event: { recipients: string[], action: QuestNotificationActions, data: any } ) {
  return server.publish(questSubscriptionOption.subscription, event);
}
