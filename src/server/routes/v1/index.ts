import profile from "./profile";
import auth from "./auth";
import map from "./map";
import quest from "./quest";
import questsResponse from './questsResponse';
import identityVerification from './sumsub'
import user from './user';
import storageService from './storageService';

export default [
  ...profile,
  ...auth,
  ...map,
  ...quest,
  ...questsResponse,
  ...identityVerification,
  ...user,
  ...storageService,
];
