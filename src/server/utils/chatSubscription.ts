
export const enum ChatNotificationActions {
  groupChatCreate = 'groupChatCreate',
  groupChatAddUser = 'groupChatAddUser',
  groupChatDeleteUser = 'groupChatDeleteUser',
  groupChatLeaveUser = 'groupChatLeaveUser',
  messageReadByRecipient = 'messageReadByRecipient',
  newMessage = 'newMessage',
}

export const chatNotificationsFilter = async function (path, notification, options): Promise<boolean> {
  return notification.recipients.includes(options.credentials.id);
}
