import profile from "./profile";
import auth from "./auth";
import map from "./map";
import quest from "./quest";
import questsResponse from './questsResponse';
import identityVerification from './sumsub'
import storageService from './storageService';
import review from './review';

export default [
  ...profile,
  ...auth,
  ...map,
  ...quest,
  ...questsResponse,
  ...identityVerification,
  ...storageService,
  ...review,
];
