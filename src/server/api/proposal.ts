import {output} from "../utils";
import {MediaController} from "../controllers/controller.media";
import {
  User,
  Proposal,
  ProposalMedia,
  ProposalStatus
} from "@workquest/database-models/lib/models";

export async function createProposal(r) {
  await MediaController.getMedias(r.payload.medias);

  const transaction = await r.server.app.db.transaction();

  const proposal = await Proposal.build({
    userId: r.auth.credentials.id,
    title: r.payload.title,
    description: r.payload.description,
    status: ProposalStatus.Pending,
    txHash: r.payload.hash,
  }, );

  const medias = r.payload.medias.map(media => {
    return {
      mediaId: media.id,
      proposalId: proposal.id,
    }
  });

  const mediaPreCreate = ProposalMedia.bulkBuild(medias);

  await proposal.$set("medias", medias, { transaction });

  await Promise.all([
    proposal.save({ transaction }),
    mediaPreCreate.map(member => member.save({ transaction })),
  ]);

  transaction.commit();

  return output(proposal);
}

export async function getProposals(r) {
  const {count, rows} = await Proposal.findAndCountAll({
   limit: r.query.limit,
   offset: r.query.offset
  });

  return({count, proposal: rows});
}

export async function getProposal(r) {
  const proposal = await Proposal.findByPk(r.params.proposalId);

  return(proposal);
}



