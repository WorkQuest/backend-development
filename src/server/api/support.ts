import { error, output } from '../utils';
import { Support, User, AdminSupportResolved, SupportStatus } from '@workquest/database-models/lib/models';
import { Errors } from '../utils/errors';

export async function createSupport(r) {
  const author: User = r.auth.credentials;

  const [post, isCreateSupport] = await Support.findOrCreate({
    where: {
      authorId: author.id,
      title: r.payload.title,
      status: SupportStatus.Created || SupportStatus.Waiting
    },
    defaults: {
      authorId: author.id,
      email: r.payload.email,
      title: r.payload.title,
      description: r.payload.description,
      status: SupportStatus.Created,
      decision: AdminSupportResolved.Waiting
    }
  });

  if (!isCreateSupport) {
    return error(Errors.Forbidden, 'User can`t send message on support platform', {});
  }

  return output();
}
