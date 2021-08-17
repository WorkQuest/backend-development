import * as jwt from "jsonwebtoken";
import config from "../config/config";
import { error } from "./index";
import { Errors } from "./errors";
import { Session, User, UserStatus } from "@workquest/database-models/lib/models";


export const generateJwt = (data: object) => {
  let access = jwt.sign(data, config.auth.jwt.access.secret, { expiresIn: config.auth.jwt.access.lifetime });
  let refresh = jwt.sign(data, config.auth.jwt.refresh.secret, { expiresIn: config.auth.jwt.refresh.lifetime });

  return { access, refresh };
};

export const decodeJwt = async (token: string, secret: string) => {
  try {
    return await jwt.verify(token, secret);
  } catch (e) {
    let code = e.name === 'TokenExpiredError' ? Errors.TokenExpired : Errors.TokenInvalid
    let msg = e.name === 'TokenExpiredError' ? 'Token expired' : 'Token invalid'
    throw error(code, msg, {});
  }
};

export type validateFunc = (r, token: string) => Promise<any>;

// Fabric which returns token validate function depending on token type
export function tokenValidate(tokenType: 'access' | 'refresh', allowedUnconfirmedRoutes: string[] = []): validateFunc {
  return async function(r, token: string) {
    const data = await decodeJwt(token, config.auth.jwt[tokenType].secret);

    const { user } = await Session.findByPk(data.id, {
      include: [{model: User}]
    });

    if (!user) {
      throw error(Errors.SessionNotFound, 'User not found', {});
    }

    if (user.status === UserStatus.Blocked) {
      throw error(Errors.InvalidStatus, 'User is blocked', {});
    }

    if (user.status === UserStatus.Unconfirmed && !allowedUnconfirmedRoutes.includes(r.route.path)) {
      throw error(Errors.UnconfirmedUser, 'Unconfirmed user', {});
    }

    const session = await Session.findByPk(user.lastSessionId);
    if(!session.isActive) {
      throw error(Errors.SessionNotFound, 'Session is not active', {});
    }
    await session.update({
      lastActionTime: Date.now(),
    });

    return { isValid: true, credentials: user, artifacts: { token, type: tokenType } };
  }
}
