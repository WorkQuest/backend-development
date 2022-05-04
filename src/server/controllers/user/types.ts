import {
  EmployerProfileVisibilitySetting,
  UserRole,
  UserStatus, WorkerProfileVisibilitySetting
} from "@workquest/database-models/lib/models";

export interface SetUserRolePayload {
  role: UserRole,
  status: UserStatus,
}

export interface UpdateEmployerProfileVisibilityPayload {
  profileVisibility: {
    ratingStatusCanRespondToQuest: number[],
    ratingStatusInMySearch: number[],
  },
}

export interface UpdateWorkerProfileVisibilityPayload {
  profileVisibility: {
    ratingStatusCanInviteMeOnQuest: number[],
    ratingStatusInMySearch: number[],
  },
}
