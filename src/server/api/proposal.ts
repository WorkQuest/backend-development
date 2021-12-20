import { error, output } from '../utils';
import { MediaController } from '../controllers/controller.media';
import { Errors } from '../utils/errors';
import {
  Proposal,
  ProposalStatus,
  ProposalVoteCastEvent
} from '@workquest/database-models/lib/models';
import { Op } from 'sequelize';


const searchFields = [
  'title',
  'description'
];
const searchFieldNumber = [
  'proposalId'
];

//TODO: improve userId to address of user's wallet
export async function createProposal(r) {

  const medias = await MediaController.getMedias(r.payload.medias);

  const transaction = await r.server.app.db.transaction();

  const proposal = await Proposal.create({
    userId: r.auth.credentials.id,
    proposer: r.payload.proposer,
    title: r.payload.title,
    description: r.payload.description,
    status: ProposalStatus.Pending
  }, { transaction });

  await proposal.$set('medias', medias, { transaction });

  transaction.commit();

  return output({
    id: proposal.id,
    userId: proposal.userId,
    proposer: proposal.proposer,
    nonce: proposal.nonce,
    title: proposal.title,
    description: proposal.description,
    status: proposal.status
  });
}

export async function getProposals(r) {
  const where = {
    ...(r.query.status && { status: r.query.status })
  };

  if (isNaN(Number(r.query.q))) {
    where[Op.or] = searchFields.map(field => ({
      [field]: { [Op.iLike]: `%${r.query.q}%` }
    }));
  }
  if (!isNaN(Number(r.query.q))) {
    where[Op.or] = searchFieldNumber.map(field => ({
      [field]: { [Op.eq]: Number(r.query.q) }
    }));
  }

  const { count, rows } = await Proposal.findAndCountAll({
    where,
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', r.query.createdAt]]
  });

  return ({ count, proposal: rows });
}


export async function getProposal(r) {

  const proposal = await Proposal.findOne({
    where: { proposalId: r.params.proposalId }
  });

  if (!proposal) {
    return error(Errors.NotFound, 'Proposal does not exist', {});
  }

  return output(proposal);
}

export async function getVotingsProposal(r) {
  const where = {
    ...(r.query.support !== undefined && { support: r.query.support }),
    ...(r.params.proposalId && { proposalId: r.params.proposalId })
  };
  const { count, rows } = await ProposalVoteCastEvent.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', r.query.createdAt]],
    where
  });

  if (!rows) {
    return error(Errors.NotFound, 'Proposal does not exist', {});
  }

  return ({ count, voting: rows });
}

