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
import forum from "./forums";

export default [
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
  ...forum
];
