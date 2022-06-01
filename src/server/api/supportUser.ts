import { Errors } from '../utils/errors';
import { error, output } from '../utils';
import {
  User,
  SupportUser,
  SupportStatus,
  AdminSupportResolved
} from '@workquest/database-models/lib/models';

export async function createSupport(r) {
  const author: User = r.auth.credentials;

  const [supportPost, isCreateSupport] = await SupportUser.findOrCreate({
    where: {
      authorUserId: author.id,
      title: r.payload.title,
      status: SupportStatus.Pending,
    },
    defaults: {
      authorUserId: author.id,
      email: r.payload.email,
      title: r.payload.title,
      description: r.payload.description,
      status: SupportStatus.Pending,
      decision: AdminSupportResolved.Pending
    }
  });

  if (!isCreateSupport) {
    return error(Errors.Forbidden, 'The user cannot send a message to the support platform, the post has already been created', {});
  }

  const result = {
    number: supportPost.number,
    authorUserId: supportPost.authorUserId,
    email: supportPost.email,
    title: supportPost.title,
    description: supportPost.description,
    status: supportPost.status,
    decision: supportPost.decision
  };

  return output(result);
}
