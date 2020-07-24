import * as jwt from 'jsonwebtoken';
import config from '../config/config';
import { error } from './index';
import { User } from '../models/User';


export const generateJwt = (data: object) => {
  let access = jwt.sign(data, config.auth.jwt.access.secret, { expiresIn: config.auth.jwt.access.lifetime });
  let refresh = jwt.sign(data, config.auth.jwt.refresh.secret, { expiresIn: config.auth.jwt.refresh.lifetime });

  return { access, refresh };
};

export const decodeJwt = async (token: string, secret: string) => {
  try {
    return await jwt.verify(token, secret);
  } catch (e) {
    let code = e.name === 'TokenExpiredError' ? 401001 : 401002
    let msg = e.name === 'TokenExpiredError' ? 'Token expired' : 'Token invalid'
    return error(code, msg, {});
  }
};

export const accessValidate = async (r, token) => {
  let data = await decodeJwt(token, config.auth.jwt.access.secret);

  if (!data.isBoom) {
    let user = await User.findByPk(data.id);

    if (user) {
      return { isValid: true, credentials: user, artifacts: { token, type: 'access' } };
    } else {
      return error(401004, 'User not found', {});
    }
  } else {
    return data
  }
};

export const refreshValidate = async (r, token) => {
  let data = await decodeJwt(token, config.auth.jwt.refresh.secret);

  if (!data.isBoom) {
    let user = await User.findByPk(data.id);

    if (user) {
      return { isValid: true, credentials: user, artifacts: { token, type: 'refresh' } };
    } else {
      return error(401004, 'User not found', {});
    }
  } else {
    return data;
  }
};
