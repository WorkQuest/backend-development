SELECT
    DISTINCT ON ("User"."id") "User"."id",
    "User"."firstName",
    "User"."lastName",
    "User"."additionalInfo",
    "User"."avatarId",
    "avatar"."id"                                        AS "avatar.id",
    "avatar"."url"                                       AS "avatar.url",
    "avatar"."contentType"                               AS "avatar.contentType"

FROM "Users" AS "User"
    LEFT OUTER JOIN "Media" AS "avatar" ON "User"."avatarId" = "avatar"."id"

    INNER JOIN "ChatMembers" AS "chatMember" ON "User"."id" = "chatMember"."userId" AND
    "chatMember"."userId" != :currentUserId

    INNER JOIN "Chats" AS "chatMember->chat" ON "chatMember"."chatId" = "chatMember->chat"."id"
    AND "chatMember->chat"."type" IN ('private', 'quest')
WHERE
    ("User"."deletedAt" IS NULL)
  AND "User"."id" NOT IN (
    SELECT "ChatMembers"."userId" FROM "ChatMembers" WHERE "ChatMembers"."chatId"= :excludeUsersFromChatId
    )
LIMIT :limitValue OFFSET :offsetValue;
