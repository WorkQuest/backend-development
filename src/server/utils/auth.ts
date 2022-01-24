import * as jwt from 'jsonwebtoken';
import config from '../config/config';
import { error } from './index';
import { Errors } from './errors';
import { User, Session, UserStatus } from '@workquest/database-models/lib/models';

export const generateJwt = (data: object) => {
  const access = jwt.sign(data, config.auth.jwt.access.secret, { expiresIn: config.auth.jwt.access.lifetime });
  const refresh = jwt.sign(data, config.auth.jwt.refresh.secret, { expiresIn: config.auth.jwt.refresh.lifetime });

  return { access, refresh };
};

export const decodeJwt = async (token: string, secret: string) => {
  try {
    return await jwt.verify(token, secret);
  } catch (e) {
    const code = e.name === 'TokenExpiredError' ? Errors.TokenExpired : Errors.TokenInvalid;
    const msg = e.name === 'TokenExpiredError' ? 'Token expired' : 'Token invalid';
    throw error(code, msg, {});
  }
};

export type validateFunc = (r, token: string) => Promise<any>;

// Fabric which returns token validate function depending on token type
export function tokenValidate(tokenType: 'access' | 'refresh', allowedUnconfirmedRoutes: string[] = []): validateFunc {
  return async function (r, token: string) {
    const data = await decodeJwt(token, config.auth.jwt[tokenType].secret);

    const session = await Session.findByPk(data.id, {
      include: [{ model: User, as: 'user' }],
    });

    if (!session) {
      throw error(Errors.SessionNotFound, 'Session not found', {});
    }
    if (session.invalidating) {
      throw error(Errors.SessionNotFound, 'Session not found', {});
    }
    if (!session.user) {
      throw error(Errors.NotFound, 'User not found', {});
    }
    if (session.user.status === UserStatus.Unconfirmed && !allowedUnconfirmedRoutes.includes(r.route.path)) {
      throw error(Errors.UnconfirmedUser, 'Unconfirmed user', {});
    }

    return { isValid: true, credentials: session.user, artifacts: { token, type: tokenType, sessionId: session.id } };
  };
}
