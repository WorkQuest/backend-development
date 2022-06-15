SELECT count(DISTINCT "User"."id") AS "count"
FROM "Users" AS "User"
    LEFT OUTER JOIN "Media" AS "avatar" ON "User"."avatarId" = "avatar"."id"

    INNER JOIN "ChatMembers" AS "chatMember" ON "User"."id" = "chatMember"."userId"

    INNER JOIN "Chats" AS "chatMember->chat" ON "chatMember"."chatId" = "chatMember->chat"."id"
    AND "chatMember->chat"."type" IN ('Private', 'Quest')
WHERE
    ("User"."deletedAt" IS NULL)
  AND "User".id != :currentUserId
  AND "chatMember->chat"."id" IN (
    SELECT "chatId" FROM "ChatMembers" WHERE "ChatMembers"."userId"=:currentUserId
  )
  AND "User"."id" NOT IN (
    SELECT "ChatMembers"."userId" FROM "ChatMembers" WHERE ("ChatMembers"."chatId"=:excludeUsersFromChatId AND "chatMember"."status"=0)
  )
