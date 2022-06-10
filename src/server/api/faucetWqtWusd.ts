import BigNumber from 'bignumber.js';
import { Errors } from '../utils/errors';
import { error, output } from '../utils';
import { sentFaucetWqtTestnetJob } from '../jobs/sentFaucetWqtTestnet';
import { sentFaucetWusdTestnetJob } from '../jobs/sentFaucetWusdTestnet';
import { FaucetAmount, FaucetWqtWusd, TransactionStatus, User } from '@workquest/database-models/lib/models';

export async function sentFaucetWusd(r) {
  const user: User = r.auth.credentials;

  const userWallet = await User.scope('shortWithWallet').findByPk(user.id);

  if (!userWallet.wallet) {
    return error(Errors.WalletExists, 'Wallet already exists', {});
  }

  const [,isCreate] = await FaucetWqtWusd.findOrCreate({
    where: {
      address: userWallet.wallet.address,
      symbol: 'WUSD'
    },
    defaults: {
      userId: user.id,
      address: userWallet.wallet.address,
      amount: new BigNumber(FaucetAmount.WUSD).shiftedBy(18).toString(),
      symbol: 'WUSD',
      status: TransactionStatus.Pending
    }
  });

  if (!isCreate) {
    return error(Errors.Forbidden, 'Test Wusd coins previously sent', {});
  }

  await sentFaucetWusdTestnetJob({
    address: userWallet.wallet.address,
    amount: FaucetAmount.WUSD
  });

  return output();
}

export async function sentFaucetWqt(r) {
  const user: User = r.auth.credentials;

  const userWallet = await User.scope('shortWithWallet').findByPk(user.id);

  if (!userWallet.wallet) {
    return error(Errors.WalletExists, 'Wallet already exists', {});
  }

  const [,isCreate] = await FaucetWqtWusd.findOrCreate({
    where: {
      address: userWallet.wallet.address,
      symbol: 'WQT'
    },
    defaults: {
      userId: user.id,
      address: userWallet.wallet.address,
      amount: new BigNumber(FaucetAmount.WQT).shiftedBy(18).toString(),
      symbol: 'WQT',
      status: TransactionStatus.Pending
    }
  });

  if (!isCreate) {
    return error(Errors.Forbidden, 'Test WQT coins previously sent', {});
  }

  await sentFaucetWqtTestnetJob({
    address: userWallet.wallet.address,
    amount: FaucetAmount.WQT
  });

  return output();
}
