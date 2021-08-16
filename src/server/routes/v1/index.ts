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
<<<<<<< HEAD
import disputes from "./disputes";
=======
import chat from "./chat";
>>>>>>> 561d68f61349e03aca6cf2ac79190386a4838140

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
<<<<<<< HEAD
  ...disputes,
=======
  ...chat,
>>>>>>> 561d68f61349e03aca6cf2ac79190386a4838140
];
