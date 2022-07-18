import { AdminActionMetadata, HTTPVerb } from '@workquest/database-models/lib/models';

export type saveAdminActionsPayload = {
  adminId: string,
  HTTPVerb: HTTPVerb,
  path: string,
};

export default async function(payload: saveAdminActionsPayload) {
  await AdminActionMetadata.create({
    adminId: payload.adminId,
    HTTPVerb: payload.HTTPVerb,
    path: payload.path,
  });
}
