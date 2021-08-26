import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { getMedias } from '../utils/medias';
import {
  Media,
  Portfolio,
  User,
  UserRole,
} from "@workquest/database-models/lib/models";

export async function addCase(r) {
  r.auth.credentials.mustHaveRole(UserRole.Worker);

  const medias = await getMedias(r.payload.medias);
  const transaction = await r.server.app.db.transaction();
  const portfolio = await Portfolio.create({
    userId: r.auth.credentials.id,
    title: r.payload.title,
    description: r.payload.description
  }, { transaction });

  await portfolio.$set('medias', medias, { transaction });

  await transaction.commit();

  return output(portfolio);
}

export async function getCases(r) {
  const worker = await User.findByPk(r.params.userId);

  if (!worker) {
    error(Errors.NotFound, "Worker not found", {});
  }

  const cases = await Portfolio.findAll({
    where: {
      userId: worker.id
    }
  });

  return output(cases);
}

export async function deleteCase(r) {
  const portfolio = await Portfolio.findByPk(r.params.portfolioId);
  const transaction = await r.server.app.db.transaction();

  if (!portfolio) {
    error(Errors.NotFound, "Portfolio not found", {});
  }

  portfolio.mustBeCaseCreator(r.auth.credentials.id);

  for (const media of portfolio.medias) {
    await Media.destroy({where: {id: media.id}, transaction});
  }

  await portfolio.destroy({transaction});
  await transaction.commit();

  return output();
}

export async function editCase(r) {
  const transaction = await r.server.app.db.transaction();
  const portfolio = await Portfolio.findByPk(r.params.portfolioId);

  if (!portfolio) {
    error(Errors.NotFound, "Portfolio not found", {});
  }

  portfolio.mustBeCaseCreator(r.auth.credentials.id);

  if (r.payload.medias) {
    const medias = await getMedias(r.payload.medias);

    await portfolio.$set('medias', medias, { transaction });
  }

  await portfolio.update(r.payload, { transaction });

  await transaction.commit();

  return output(
    await Portfolio.findByPk(portfolio.id)
  );
}
