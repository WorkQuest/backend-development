UPDATE "ChatMemberData"
SET "unreadCountMessages" = "ChatMemberData"."unreadCountMessages" + 1
FROM "ChatMembers"
WHERE "ChatMemberData"."chatMemberId" = "ChatMembers"."id"
"ChatMembers"."chatId" = :chatId
AND "ChatMembers"."id" not in (:skipMembersIds);
