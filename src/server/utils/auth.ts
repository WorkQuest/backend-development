import * as jwt from 'jsonwebtoken';
import config from '../config/config';
import { error } from './index';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { Errors } from './errors';


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
export function tokenValidate(tokenType: 'access' | 'refresh'): validateFunc {
  return async function(r, token: string) {
    let data = await decodeJwt(token, config.auth.jwt[tokenType].secret);

    let { user } = await Session.findByPk(data.id, {
      include: [{model: User}]
    });

    if (user) {
      return { isValid: true, credentials: user, artifacts: { token, type: tokenType } };
    } else {
      throw error(Errors.SessionNotFound, 'User not found', {});
    }
  }
}
