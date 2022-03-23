SELECT *
FROM (SELECT "event"."blockNumber"                AS "blockNumber",
             "event"."transactionHash"            AS "transactionHash",
             "event"."referral"                   AS "referral",
             "event"."affiliate"                  AS "affiliate",
             "event"."amount"                     AS "amount",
             "event"."timestamp"                  AS "timestamp",
             'PaidReferral'                       AS "event",
             "referralUser"."firstName"           AS "referralUser.firstName",
             "referralUser"."lastName"            AS "referralUser.lastName",
             "referralUser->avatar"."url"         AS "referralUser.avatar.url",
             "referralUser->avatar"."contentType" AS "referralUser.avatar.contentType"
      FROM "ReferralProgramEventPaidReferrals" AS "event"
               LEFT JOIN "Wallets" AS "referralWallet" ON "referralWallet"."address" = "referral"
               LEFT JOIN "Users" AS "referralUser" ON "referralUser"."id" = "referralWallet"."userId"
               LEFT JOIN "Media" AS "referralUser->avatar" ON "referralUser->avatar"."id" = "referralUser"."avatarId"
      WHERE "event"."affiliate" = :affiliate
      UNION
      SELECT "event"."blockNumber"                 AS "blockNumber",
             "event"."transactionHash"             AS "transactionHash",
             null                                  AS "referral",
             "event"."affiliate"                   AS "affiliate",
             "event"."amount"                      AS "amount",
             "event"."timestamp"                   AS "timestamp",
             'RewardClaimed'                       AS "event",
             "affiliateUser"."firstName"           AS "affiliateUser.firstName",
             "affiliateUser"."lastName"            AS "affiliateUser.lastName",
             "affiliateUser->avatar"."url"         AS "affiliateUser.avatar.url",
             "affiliateUser->avatar"."contentType" AS "affiliateUser.avatar.contentType"
      FROM "ReferralProgramEventRewardClaimeds" as "event"
               LEFT JOIN "Wallets" AS "affiliateWallet" ON "affiliateWallet"."address" = "affiliate"
               LEFT JOIN "Users" AS "affiliateUser" ON "affiliateUser"."id" = "affiliateWallet"."userId"
               LEFT JOIN "Media" AS "affiliateUser->avatar" ON "affiliateUser->avatar"."id" = "affiliateUser"."avatarId"
      WHERE "event"."affiliate" = :affiliate
      ORDER BY "timestamp" DESC
     ) as events
    LIMIT :limit OFFSET :offset;
