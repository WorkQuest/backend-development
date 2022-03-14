SELECT *
FROM (SELECT "blockNumber",
             "transactionHash",
             "referral",
             "affiliate",
             "amount",
             "timestamp",
             'PaidReferral' as "event"
      FROM "ReferralProgramEventPaidReferrals"
      WHERE "affiliate" = :affiliate
      UNION
      SELECT "blockNumber",
             "transactionHash",
             null            as "referral",
             "affiliate",
             "amount",
             "timestamp",
             'RewardClaimed' as "event"
      FROM "ReferralProgramEventRewardClaimeds"
      WHERE "affiliate" = :affiliate
      ORDER BY "timestamp" DESC
    ) as events
LIMIT :limit
OFFSET :offset
