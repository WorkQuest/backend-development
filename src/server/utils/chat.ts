import { Chat } from "../models/Chat";

export async function getAlias(r) {
  const groupsAmount = await Chat.count({
    where: {
      isPrivate: false
    }
  });

  const receiver = r.payload.membersId.filter(function(id) {
    return r.auth.credentials.id !== id;
  });

  if (r.payload.isPrivate && !receiver[0]) {
    return "Favorite";
  }

  if (r.payload.isPrivate && receiver[0]) {
    return "";
  }

  return `Group_${groupsAmount + 1}`;
}

