import { output } from '../utils';
import { getMedias } from '../utils/medias';
import { UserController, UserControllerFactory } from "../controllers/user/controller.user";
import { PortfolioControllerFactory } from "../controllers/user/controller.portfolio";
import {
  User,
  UserRole,
  Portfolio,
} from "@workquest/database-models/lib/models";

export async function addCase(r) {
  const userController = new UserController(r.auth.credentials);

  await userController.userMustHaveRole(UserRole.Worker);

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
  const workerController = await UserControllerFactory.makeControllerByModel(worker);

  const cases = await Portfolio.findAll({
    where: { userId: worker.id },
  });

  return output(cases); // TODO add pagination
}

export async function deleteCase(r) {
  const portfolio = await Portfolio.findByPk(r.params.portfolioId);
  const portfolioController = await PortfolioControllerFactory.makeControllerByModel(portfolio);

  portfolioController.mustBeCaseCreator(r.auth.credentials.id);

  await portfolio.destroy();

  return output();
}

export async function editCase(r) {
  const portfolio = await Portfolio.findByPk(r.params.portfolioId);
  const portfolioController = await PortfolioControllerFactory.makeControllerByModel(portfolio);

  portfolioController.mustBeCaseCreator(r.auth.credentials.id);

  const transaction = await r.server.app.db.transaction();

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
