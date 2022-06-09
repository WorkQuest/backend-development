import { Errors } from '../utils/errors';
import { error, output } from '../utils';
import {
  User,
  TicketStatus,
  SupportTicketForUser,
} from '@workquest/database-models/lib/models';

export async function createSupport(r) {
  const meUser: User = r.auth.credentials;

  const [supportTicket, isCreateSupport] = await SupportTicketForUser.findOrCreate({
    where: {
      authorUserId: meUser.id,
      title: r.payload.title,
      status: TicketStatus.Pending,
    },
    defaults: {
      authorUserId: meUser.id,
      replyToMail: r.payload.email,
      title: r.payload.title,
      description: r.payload.description,
      status: TicketStatus.Pending,
    }
  });

  if (!isCreateSupport) {
    return error(Errors.Forbidden, 'The user cannot send a message to the support platform, the post has already been created', {});
  }

  return output(supportTicket);
}

export async function getSupportTickets(r) {
  const meUser: User = r.auth.credentials

  const { count, rows } = await SupportTicketForUser.findAndCountAll({
    where: {
      authorUserId: meUser.id,
      status: r.query.status,
    },
    limit: r.query.limit,
    offset: r.query.offset,
    order: [['createdAt', r.query.sort.createdAt]],
  });

  return output({ count, tickets: rows });
}
