import {
  UserRole,
  UserStatus,
  RatingStatus,
} from "@workquest/database-models/lib/models";

export interface SetUserRolePayload {
  role: UserRole,
  status: UserStatus,
}

export interface UpdateEmployerProfileVisibilityPayload {
  ratingStatusCanRespondToQuest: RatingStatus[];
  ratingStatusInMySearch: RatingStatus[];
}

export interface UpdateWorkerProfileVisibilityPayload {
  ratingStatusCanInviteMeOnQuest: RatingStatus[];
  ratingStatusInMySearch: RatingStatus[];
}
