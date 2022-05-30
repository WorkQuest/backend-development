import { Op } from 'sequelize';
import { Errors } from '../utils/errors';
import { error, output } from '../utils';
import { Support, User, AdminSupportResolved, SupportStatus } from '@workquest/database-models/lib/models';

export async function createSupport(r) {
  const author: User = r.auth.credentials;

  const [supportPost, isCreateSupport] = await Support.findOrCreate({
    where: {
      authorId: author.id,
      title: r.payload.title,
      status: {
        [Op.or]: [SupportStatus.Created, SupportStatus.Waiting]
      }
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
    return error(Errors.Forbidden, 'The user cannot send a message to the support platform, the post has already been created', {});
  }

  const result = {
    supportTicket: supportPost.supportTicket,
    authorId: supportPost.authorId,
    email: supportPost.email,
    title: supportPost.title,
    description: supportPost.description,
    status: supportPost.status,
    decision: supportPost.decision
  };

  return output(result);
}
