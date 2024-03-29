import { Op, literal, IncludeOptions } from 'sequelize';
import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { MediaController } from '../controllers/controller.media';
import {
  User,
  Wallet,
  Proposal,
  ProposalStatus,
  ProposalCreatedEvent,
  ProposalVoteCastEvent,
  ProposalDelegateChangedEvent,
  ProposalDelegateVotesChangedEvent, ProposalDelegateUserHistory
} from '@workquest/database-models/lib/models';

const searchFields = ['title', 'description'];

function getDelegateIncludeOptions(modelAlias) {
  return {
    model: Wallet,
    as: modelAlias,
    attributes: [
      'address',
      'bech32Address'
    ],
    include: [{
      model: User.scope('shortForList'),
      as: 'user'
    }]
  } as IncludeOptions
}

export async function createProposal(r) {
  const user: User = r.auth.credentials;

  const userWaller = Wallet.findOne({
    where: { userId: user.id },
  });

  if (!userWaller) {
    return error(Errors.Forbidden, 'User does not have a wallet on the platform', {});
  }

  const medias = await MediaController.getMedias(r.payload.medias);

  const [proposal] = await r.server.app.db.transaction(async (tx) => {
    const proposal = await Proposal.create({
      proposerUserId: r.auth.credentials.id,
      title: r.payload.title,
      description: r.payload.description,
      status: ProposalStatus.Pending,
    }, { transaction: tx });

    await proposal.$set('medias', medias, { transaction: tx });

    return [proposal];
  });

  return output(proposal);
}

export async function getProposals(r) {
  const searchByProposalIdLiteral = literal(
    `(SELECT "contractProposalId"::TEXT FROM "ProposalCreatedEvents" ` +
    `WHERE "proposalId" = "Proposal"."id") ILIKE :query `,
  );

  const where = {
    ...(r.query.statuses && { status: r.query.statuses }),
  };

  const order = [];

  for (const [key, value] of Object.entries(r.query.sort || {})) {
    order.push([key, value]);
  }

  if (r.query.q) {
    where[Op.or] = searchFields.map((field) => ({
      [field]: { [Op.iLike]: `%${r.query.q}%` },
    }));

    where[Op.or].push(searchByProposalIdLiteral);
  }

  const { count, rows } = await Proposal.findAndCountAll({
    where,
    order,
    distinct: true,
    limit: r.query.limit,
    offset: r.query.offset,
    include: {
      model: ProposalCreatedEvent,
      as: 'createdEvent',
      attributes: ['contractProposalId', 'votingPeriod', 'timestamp']
    },
    replacements: { query: '%' + r.query.q + '%' },
  });

  return { count, proposals: rows };
}

export async function getProposal(r) {
  const proposal = await Proposal.findByPk(r.params.proposalId, {
    include: {
      model: ProposalCreatedEvent,
      as: 'createdEvent',
      attributes: {
        exclude: [
          'id',
          'network',
          'createdAt',
          'updatedAt',
        ]
      }
    },
  });

  if (!proposal) {
    return error(Errors.NotFound, 'Proposal does not exist', {});
  }

  return output(proposal);
}

export async function getVoteCastEventsProposal(r) {
  const where = {
    ...(r.params.proposalId && { proposalId: r.params.proposalId }),
    ...(typeof r.query.support === 'boolean' && { support: r.query.support }),
  };

  const order = [];

  for (const [key, value] of Object.entries(r.query.sort || {})) {
    order.push([key, value]);
  }

  const { count, rows } = await ProposalVoteCastEvent.findAndCountAll({
    where, order,
    limit: r.query.limit,
    offset: r.query.offset,
  });

  return { count, votes: rows };
}

export async function getDelegateChangedEvents(r) {
  const where = {
    ...(r.query.delegator && { delegator: r.query.delegator.toLowerCase() }),
    ...(r.query.fromDelegate && { fromDelegate: r.query.fromDelegate.toLowerCase() }),
    ...(r.query.toDelegate && { toDelegate: r.query.toDelegate.toLowerCase() }),
  }

  const { count, rows: delegates } = await ProposalDelegateChangedEvent.findAndCountAll({
    where,
    attributes: {
      exclude: [
        'id',
        'network',
        'createdAt',
        'updatedAt'
      ],
    },
    include: [
      getDelegateIncludeOptions('delegatorWallet'),
      getDelegateIncludeOptions('fromDelegateWallet'),
      getDelegateIncludeOptions('toDelegateWallet'),
    ],
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['timestamp', 'DESC']]
  });

  return output({ count, delegates });
}

export async function getMyDelegateHistory(r) {
  const delegatorWallet = await Wallet.findOne({
    attributes: ['address'],
    where: { userId: r.auth.credentials.id }
  });

  if (!delegatorWallet) {
    return error(Errors.NotFound, 'User wallet not found', {});
  }

  const { count, rows: delegates } = await ProposalDelegateUserHistory.findAndCountAll({
    distinct: true,
    col: 'delegatee',
    include: [{
      model: Wallet,
      as: 'delegateeWallet',
      attributes: ['address', 'bech32Address'],
      include: [{
        model: User.scope('shortForList'),
        as: 'user'
      }],
    }],
    limit: r.query.limit,
    offset: r.query.offset,
    attributes: ['delegator', 'delegatee', 'timestamp'],
    where: { delegator: delegatorWallet.address },
    order: [['timestamp', 'DESC']]
  });

  return output({ count, delegates });
}

export async function getDelegateVotesChangedEvents(r) {
  const where = {
    ...(r.query.delegator && { delegator: r.query.delegator.toLowerCase() }),
    ...(r.query.delegatee && { delegatee: r.query.delegatee.toLowerCase() })
  }

  const { count, rows: votes } = await ProposalDelegateVotesChangedEvent.findAndCountAll({
    where,
    attributes: {
      exclude: ['id', 'network', 'createdAt', 'updatedAt', 'timestamp'],
      include: [
        [literal('"newBalance" - "previousBalance"'), 'delegated'],
        [literal(`
          CASE WHEN "newBalance" - "previousBalance" > 0 
            THEN 'delegate' 
            ELSE 'undelegate' END
        `), 'type'],
        [literal('"timestamp"'), 'delegateTimestamp']
      ]
    },
    limit: r.query.limit,
    offset: r.query.offset,
    order: literal('timestamp DESC, delegated DESC')
  });

  return output({ count, votes });
}