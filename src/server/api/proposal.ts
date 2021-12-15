import { error, output } from '../utils';
import { MediaController } from '../controllers/controller.media';
import {
  Proposal, ProposalStatus
} from '@workquest/database-models/lib/models';
import { Op } from 'sequelize';

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
    status: proposal.status,
  });
}

export async function getProposals(r) {
  const { count, rows } = await Proposal.findAndCountAll({
    where: {
      status: { [Op.ne]: 0 }
    },
    limit: r.query.limit,
    offset: r.query.offset
  });

  return ({ count, proposal: rows });
}

export async function getProposal(r) {
  const proposal = await Proposal.findByPk(r.params.proposalId);

  return (proposal);
}


