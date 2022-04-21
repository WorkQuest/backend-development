import profile from './profile';
import auth from './auth';
import quest from './quest';
import questsResponse from './questsResponse';
import identityVerification from './sumsub';
import storageService from './storageService';
import review from './questReview';
import restorePassword from './restorePassword';
import portfolio from './portfolio';
import totp from './totp';
import disputes from './questDispute';
import chat from './chat';
import bridge from './bridge';
import liquidityPoolWETH from './liquidityPool(wqt-weth)';
import liquidityPoolWBNB from './liquidityPool(wqt-wbnb)';
import discussion from './discussion';
import skillFilters from './skillFilters';
import proposal from './proposal';
import pensionFund from './pensionFund';
import referral from './referral';
import savingProduct from "./savingProduct";
import faucetWusdWqt from './faucetWusdWqt';

export default [
  ...liquidityPoolWETH,
  ...liquidityPoolWBNB,
  ...profile,
  ...auth,
  ...quest,
  ...questsResponse,
  ...identityVerification,
  ...storageService,
  ...review,
  ...restorePassword,
  ...portfolio,
  ...totp,
  ...disputes,
  ...chat,
  ...bridge,
  ...discussion,
  ...skillFilters,
  ...proposal,
  ...pensionFund,
  ...referral,
  ...savingProduct,
  ...faucetWusdWqt
];
