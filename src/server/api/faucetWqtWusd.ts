import BigNumber from 'bignumber.js';
import { Errors } from '../utils/errors';
import { error, output } from '../utils';
import { sendFaucetWqtTestnetJob } from '../jobs/sendFaucetWqtTestnet';
import { sendFaucetWusdTestnetJob } from '../jobs/sendFaucetWusdTestnet';
import {
  User,
  Wallet,
  FaucetSymbol,
  FaucetAmount,
  FaucetWqtWusd,
  TransactionStatus,
} from '@workquest/database-models/lib/models';

export async function sentFaucetWusd(r) {
  const user: User = r.auth.credentials;

  const wallet = await Wallet.findOne({ where: { userId: user.id } });

  if (!wallet) {
    return error(Errors.NotFound, 'User don`t has wallet', {});
  }

  const [, isCreated] = await FaucetWqtWusd.findOrCreate({
    where: {
      address: wallet.address,
      symbol: FaucetSymbol.WUSD
    },
    defaults: {
      userId: user.id,
      address: wallet.address,
      amount: new BigNumber(FaucetAmount.WUSD).shiftedBy(18).toString(),
      symbol: FaucetSymbol.WUSD,
      status: TransactionStatus.Pending
    }
  });

  if (!isCreated) {
    return error(Errors.Forbidden, 'Test Wusd coins previously sent', {});
  }

  await sendFaucetWusdTestnetJob({
    address: wallet.address,
    amount: FaucetAmount.WUSD
  });

  return output();
}

export async function sentFaucetWqt(r) {
  const user: User = r.auth.credentials;

  const wallet = await Wallet.findOne({ where: { userId: user.id } });

  if (!wallet) {
    return error(Errors.NotFound, 'User don`t has wallet', {});
  }

  const [, isCreated] = await FaucetWqtWusd.findOrCreate({
    where: {
      address: wallet.address,
      symbol: FaucetSymbol.WQT
    },
    defaults: {
      userId: user.id,
      address: wallet.address,
      amount: new BigNumber(FaucetAmount.WQT).shiftedBy(18).toString(),
      symbol: FaucetSymbol.WQT,
      status: TransactionStatus.Pending
    }
  });

  if (!isCreated) {
    return error(Errors.Forbidden, 'Test WQT coins previously sent', {});
  }

  await sendFaucetWqtTestnetJob({
    address: wallet.address,
    amount: FaucetAmount.WQT
  });

  return output();
}
