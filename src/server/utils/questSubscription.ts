
export const questNotificationFilter = async function (path, notification, options): Promise<boolean> {
  if (notification.notificationOwnerUserId === options.credentials.id) {
    return false;
  }

  return options.credentials.id === notification.invitedUserId;
}
