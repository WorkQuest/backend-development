import { Op } from 'sequelize';
import config from '../../config/config';
import { BaseDomainHandler } from '../types';
import { Session } from '@workquest/database-models/lib/models';
import { LogoutOtherSessionsCommand, LogoutOtherSessionsResult } from './types';

export class LogoutOtherSessionsHandler extends BaseDomainHandler<LogoutOtherSessionsCommand, LogoutOtherSessionsResult> {
  public async Handle(command: LogoutOtherSessionsCommand): LogoutOtherSessionsResult {
    await Session.update({ invalidating: true, logoutAt: Date.now() }, {
      where: {
        userId: command.user.id,
        id: { [Op.not]: command.currentSession.id },
        createdAt: { [Op.gte]: Date.now() - config.auth.jwt.refresh.lifetime * 1000 },
      },
      transaction: this.options.tx,
    });
  }
}
