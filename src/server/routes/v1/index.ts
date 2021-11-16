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
import disputes from "./disputes";
import chat from "./chat";
import bridge from "./bridge";
import liquidityPoolWETH from "./liquidityPool(wqt-weth)";
import liquidityPoolWBNB from "./liquidityPool(wqt-wbnb)";
import discussion from "./discussion";
import skillFilters from "./skillFilters";

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
  ...disputes,
  ...chat,
  ...bridge,
  ...discussion,
  ...skillFilters,
];
