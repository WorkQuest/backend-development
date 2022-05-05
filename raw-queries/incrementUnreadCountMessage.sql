UPDATE "ChatMemberData"
SET "unreadCountMessages" = "ChatMemberData"."unreadCountMessages" + 1
FROM "ChatMembers"
WHERE "ChatMemberData"."chatMemberId" = "ChatMembers"."id"
AND ("ChatMembers"."chatId" = :chatId AND "ChatMembers"."status" = 'active')
AND "ChatMembers"."id" not in (:skipMembersIds);
