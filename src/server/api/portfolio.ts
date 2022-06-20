import { output } from '../utils';
import { UserOldController } from '../controllers/user/controller.user';
import { PortfolioController } from '../controllers/user/controller.portfolio';
import { User, Portfolio } from '@workquest/database-models/lib/models';
import { CreatePortfolioCaseComposHandler, EditPortfolioCaseComposHandler } from '../handlers/compositions';

export async function addCase(r) {
  const meUser: User = r.auth.credentials;

  const { mediaIds, title, description } = r.payload as { mediaIds: string[], title: string, description: string };

  const portfolioCase = await new CreatePortfolioCaseComposHandler(r.server.app.db).Handle({
    title,
    mediaIds,
    description,
    user: meUser,
  });

  return output(portfolioCase);
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
  const meUser: User = r.auth.credentials;

  const { portfolioId } = r.payload.params as { portfolioId: string };
  const { mediaIds, title, description } = r.payload as { mediaIds: string[], title: string, description: string };

  const portfolio = await new EditPortfolioCaseComposHandler(r.server.app.db).Handle({
    title,
    mediaIds,
    description,
    portfolioId,
    user: meUser,
  });

  return output(portfolio);
}
