import { output } from '../utils';
import { MediaController } from '../controllers/controller.media';
import { UserOldController } from '../controllers/user/controller.user';
import { PortfolioController } from '../controllers/user/controller.portfolio';
import { User, UserRole, Portfolio } from '@workquest/database-models/lib/models';

export async function addCase(r) {
  const medias = await MediaController.getMedias(r.payload.medias);
  const userController = new UserOldController(r.auth.credentials);

  await userController.userMustHaveRole(UserRole.Worker);

  const transaction = await r.server.app.db.transaction();

  const portfolioController = await PortfolioController.new(
    {
      userId: userController.user.id,
      title: r.payload.title,
      description: r.payload.description,
    },
    transaction,
  );

  await portfolioController.setMedias(medias, transaction);

  await transaction.commit();

  return output(portfolioController.portfolio);
}

export async function getCases(r) {
  const workerController = new UserOldController(await User.findByPk(r.params.userId));

  const { count, rows } = await Portfolio.findAndCountAll({
    where: { userId: workerController.user.id },
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', 'DESC']],
  });

  return output({ count, cases: rows });
}

export async function deleteCase(r) {
  const portfolioController = new PortfolioController(await Portfolio.findByPk(r.params.portfolioId));

  portfolioController.mustBeCaseCreator(r.auth.credentials.id);

  await portfolioController.destroy();

  return output();
}

export async function editCase(r) {
  const medias = await MediaController.getMedias(r.payload.medias);

  const portfolio = await Portfolio.findByPk(r.params.portfolioId);
  const portfolioController = new PortfolioController(portfolio);

  portfolioController.mustBeCaseCreator(r.auth.credentials.id);

  const transaction = await r.server.app.db.transaction();

  await portfolioController.update(r.payload, transaction);
  await portfolioController.setMedias(medias, transaction);

  await transaction.commit();

  return output(await Portfolio.findByPk(portfolio.id));
}
