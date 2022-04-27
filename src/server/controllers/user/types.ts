import {
  UserRole,
  UserStatus
} from "@workquest/database-models/lib/models";

export interface SetUserRolePayload {
  role: UserRole,
  status: UserStatus,
}
