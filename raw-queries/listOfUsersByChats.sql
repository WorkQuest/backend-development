SELECT *
FROM (SELECT
             "event"."blockNumber",
             "event"."transactionHash",
             "event"."referral",
             "event"."affiliate",
             "event"."amount",
             "event"."timestamp",
             'PaidReferral'         as "event",
             "referralUser"."firstName" as "referralUser.firstName",
             "referralUser"."lastName" as "referralUser.lastName",
             "referralUser->avatar"."url"         as "referralUser.avatar.url",
             "referralUser->avatar"."contentType" as "referralUser.avatar.contentType"
      FROM "ReferralProgramEventPaidReferrals" as "event"
               LEFT JOIN "Wallets" as "referralWallet" ON "referralWallet"."address" = "referral"
               LEFT JOIN "Users" as "referralUser" ON "referralUser"."id" = "referralWallet"."userId"
               LEFT JOIN "Media" as "referralUser->avatar" ON "referralUser->avatar"."id" = "referralUser"."avatarId"
      WHERE "event"."affiliate" = :affiliate
      UNION
      SELECT
             "event"."blockNumber",
             "event"."transactionHash",
             null                   as "referral",
             "event"."affiliate",
             "event"."amount",
             "event"."timestamp",
             'RewardClaimed'        as "event",
             "affiliateUser"."firstName" as "affiliateUser.firstName",
             "affiliateUser"."lastName" as "affiliateUser.lastName",
             "affiliateUser->avatar"."url"         as "affiliateUser.avatar.url",
             "affiliateUser->avatar"."contentType" as "affiliateUser.avatar.contentType"
      FROM "ReferralProgramEventRewardClaimeds" as "event"
               LEFT JOIN "Wallets" as "affiliateWallet" ON "affiliateWallet"."address" = "affiliate"
               LEFT JOIN "Users" as "affiliateUser" ON "affiliateUser"."id" = "affiliateWallet"."userId"
               LEFT JOIN "Media" as "affiliateUser->avatar" ON "affiliateUser->avatar"."id" = "affiliateUser"."avatarId"
      WHERE "event"."affiliate" = :affiliate
      ORDER BY "timestamp" DESC
     ) as events
LIMIT :limit OFFSET :offset;
