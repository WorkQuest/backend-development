import { ChatMember } from "@workquest/database-models/src/models";

export const chatNotificationsFilter = async function (path, notification, options): Promise<boolean> {
  if (notification.notificationOwnerUserId === options.credentials.id) {
    return false;
  }

  const member = await ChatMember.findOne({
    where: { chatId: notification.chatId, userId: options.credentials.id },
    attributes: ['id'],
  });

  return member !== null;
}
