import profile from "./profile";
import auth from "./auth";
import map from "./map";
import quest from "./quest";
import questsResponse from './questsResponse';
import identityVerification from './sumsub'
import storageService from './storageService';
import review from './review';
import restorePassword from './restorePassword';
import portfolio from './portfolio';
import totp from './totp';
import chat from "./chat";
import bridge from "./bridge";
import liquidityPoolWETH from "./liquidityPool(wqt-weth)";
import liquidityPoolWBNB from "./liquidityPool(wqt-wbnb)";

export default [
  ...liquidityPoolWETH,
  ...liquidityPoolWBNB,
  ...profile,
  ...auth,
  ...map,
  ...quest,
  ...questsResponse,
  ...identityVerification,
  ...storageService,
  ...review,
  ...restorePassword,
  ...portfolio,
  ...totp,
  ...chat,
  ...bridge,
];
