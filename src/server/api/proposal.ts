import { output } from '../utils';
import { MediaController } from '../controllers/controller.media';
import {
  Proposal, ProposalCreatedEvents,
  ProposalStatus
} from '@workquest/database-models/lib/models';

//TODO: improve userId to address of user's wallet
export async function createProposal(r) {
  const medias = await MediaController.getMedias(r.payload.medias);

  const transaction = await r.server.app.db.transaction();

  const proposal = await Proposal.create({
    userId: r.auth.credentials.id,
    walletId: r.payload.walletId,
    title: r.payload.title,
    description: r.payload.description,
    status: ProposalStatus.Pending
  }, { transaction });

  await proposal.$set('medias', medias, { transaction });

  transaction.commit();

  return output(proposal);
}

export async function getProposals(r) {
  const { count, rows } = await Proposal.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset
  });

  return ({ count, proposal: rows });
}

export async function getProposal(r) {
  const proposal = await Proposal.findByPk(r.params.proposalId);

  return (proposal);
}

export async function getHistoryProposals(r) {
  const { count, rows } = await ProposalCreatedEvents.findAndCountAll({
    limit: r.query.limit,
    offset: r.query.offset
  });

  return ({ count, proposal: rows });
}


