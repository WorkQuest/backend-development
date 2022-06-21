import { Op } from 'sequelize';
import config from '../../config/config';
import { BaseDomainHandler } from '../types';
import { Session } from '@workquest/database-models/lib/models';
import { LogoutAllSessionsCommand, LogoutAllSessionsResult } from './types';

export class LogoutAllSessionsHandler extends BaseDomainHandler<LogoutAllSessionsCommand, LogoutAllSessionsResult> {
  public async Handle(command: LogoutAllSessionsCommand): LogoutAllSessionsResult {
    await Session.update({ invalidating: true, logoutAt: Date.now() }, {
      where: {
        userId: command.user.id,
        createdAt: { [Op.gte]: Date.now() - config.auth.jwt.refresh.lifetime * 1000 },
      },
      transaction: this.options.tx,
    });
  }
}
