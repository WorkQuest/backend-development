import { Media, Portfolio } from '@workquest/database-models/lib/models';
import { Transaction } from 'sequelize';
import { Errors } from '../../utils/errors';
import { error } from '../../utils';

export interface PortfolioDTO {
  id?: string;
  userId: string;
  title: string;
  description: string;
}

abstract class PortfolioHelper {
  public abstract portfolio: Portfolio;

  public async setMedias(medias: Media[], transaction?: Transaction) {
    try {
      await this.portfolio.$set('medias', medias, { transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
        throw e;
      }
    }
  }

  mustBeCaseCreator(userId: string): PortfolioHelper {
    if (this.portfolio.userId !== userId) {
      throw error(Errors.Forbidden, 'User is not portfolio creator', {
        current: this.portfolio.userId,
        mustHave: userId,
      });
    }

    return this;
  }
}

export class PortfolioController extends PortfolioHelper {
  constructor(public portfolio: Portfolio) {
    super();

    if (!portfolio) {
      throw error(Errors.NotFound, 'Portfolio not found', {});
    }
  }

  public async update(portfolioDto: PortfolioDTO, transaction?: Transaction) {
    try {
      this.portfolio = await this.portfolio.update(portfolioDto, { transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }

  public async destroy(transaction?: Transaction) {
    try {
      await this.portfolio.destroy({ transaction });
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
    }
  }

  static async new(portfolioDto: PortfolioDTO, transaction?: Transaction): Promise<PortfolioController> {
    try {
      const portfolio = await Portfolio.create(portfolioDto, { transaction });

      return new PortfolioController(portfolio);
    } catch (e) {
      if (transaction) {
        await transaction.rollback();
      }
      throw e;
    }
  }
}
