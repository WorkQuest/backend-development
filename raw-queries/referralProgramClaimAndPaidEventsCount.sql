SELECT count(*) AS "count"
FROM (
    SELECT 'PaidReferral' as "event"
    FROM "ReferralProgramEventPaidReferrals"
    WHERE "affiliate" = :affiliate

    UNION

    SELECT 'RewardClaimed' as "event"
    FROM "ReferralProgramEventRewardClaimeds"
    WHERE "affiliate" = :affiliate
) as events
