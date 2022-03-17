SELECT *
FROM (SELECT "blockNumber",
             "transactionHash",
             "referral",
             "affiliate",
             "amount",
             "timestamp",
             'PaidReferral'         as "event",
             "firstName",
             "lastName",
             "avatar"."id"          as "avatar.id",
             "avatar"."url"         as "avatar.url",
             "avatar"."contentType" as "avatar.contentType"
      FROM "Users"
               LEFT JOIN "Media" as "avatar" ON "avatar"."id" = "Users"."avatarId",
           "ReferralProgramEventPaidReferrals"
               INNER JOIN "Wallets" ON "Wallets"."address" = "referral"
      WHERE "affiliate" = :affiliate
        AND "Users"."id" = "Wallets"."userId"
      UNION
      SELECT "blockNumber",
             "transactionHash",
             null                   as "referral",
             "affiliate",
             "amount",
             "timestamp",
             'RewardClaimed'        as "event",
             "firstName",
             "lastName",
             "avatar"."id"          as "avatar.id",
             "avatar"."url"         as "avatar.url",
             "avatar"."contentType" as "avatar.contentType"
      FROM "Users"
               LEFT JOIN "Media" as "avatar" ON "avatar"."id" = "Users"."avatarId",
           "ReferralProgramEventPaidReferrals"
               INNER JOIN "Wallets" ON "Wallets"."address" = "referral"
      WHERE "affiliate" = :affiliate
        AND "Users"."id" = "Wallets"."userId"
      ORDER BY "timestamp" DESC
     ) as events
LIMIT :limit OFFSET :offset;
