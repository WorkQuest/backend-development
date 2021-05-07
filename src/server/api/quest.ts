import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { Priority, Quest } from '../models/Quest';
import { Column, DataType, ForeignKey } from 'sequelize-typescript';
import { User } from '../models/User';
import map from '../routes/v1/map';
import { Op } from 'sequelize';

export async function create(r) {
//  questsOfUser(r);


  // if(!r.auth.isValid) {
  //   throw error(Errors.SessionNotFound, 'User not authorized', {});
  //   // throw error(Errors.UnconfirmedUser, 'User not authorized', {}); // TODO: Нужна ли эта проверка и ошибка, если проверка идет на авторизации?
  // }
  const user = r.auth.credentials;
  await Quest.create({
    userId: user.id,
    category: r.payload.category,
    priority: r.payload.priority,
    address: r.payload.address,
    title: r.payload.title,
    description: r.payload.description,
    price: r.payload.price,
  });

  return output();
}

export async function questsOfUser(r) {
  // if(!r.auth.isValid) {
  //   throw error(Errors.SessionNotFound, 'User not authorized', {});
  //   // throw error(Errors.UnconfirmedUser, 'User not authorized', {}); // TODO: Нужна ли эта проверка и ошибка, если проверка идет на авторизации?
  // }
  const user = r.auth.credentials;
  const questOfUser = await Quest.findAll({ where: { userId: { [Op.iLike]: user.id } } });




  return output();
}
