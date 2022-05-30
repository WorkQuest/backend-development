import { Op, literal } from 'sequelize';
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
} from '@workquest/database-models/lib/models';

const searchFields = ['title', 'description'];

export async function createProposal(r) {
  const user: User = r.auth.credentials;

  const userWaller = Wallet.findOne({
    where: { userId: user.id },
  });

  if (!userWaller) {
    return error(Errors.Forbidden, 'User does not have a wallet on the platform', {});
  }

  const medias = await MediaController.getMedias(r.payload.medias);

  const transaction = await r.server.app.db.transaction();

  const proposal = await Proposal.create({
    proposerUserId: r.auth.credentials.id,
    title: r.payload.title,
    description: r.payload.description,
    status: ProposalStatus.Pending,
  }, { transaction });

  await proposal.$set('medias', medias, { transaction });

  await transaction.commit();

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
