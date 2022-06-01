import { Errors } from '../utils/errors';
import { error, output } from '../utils';
import {
  User,
  SupportUser,
  SupportStatus,
  AdminSupportResolved
} from '@workquest/database-models/lib/models';

export async function createSupport(r) {
  // const author: User = r.auth.credentials;
  const author = { id: 'df76449e-7bf5-4128-b34c-4e2b367cd0e0'}

  const [supportTicket, isCreateSupport] = await SupportUser.findOrCreate({
    where: {
      authorUserId: author.id,
      title: r.payload.title,
      status: SupportStatus.Pending
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
    number: supportTicket.number,
    authorUserId: supportTicket.authorUserId,
    email: supportTicket.email,
    title: supportTicket.title,
    description: supportTicket.description,
    status: supportTicket.status,
    decision: supportTicket.decision
  };

  return output(result);
}

export async function getSupportTickets(r) {
  // const user : User = r.auth.credentials
  const user = { id: 'df76449e-7bf5-4128-b34c-4e2b367cd0e0'}

  const tickets = await SupportUser.findAndCountAll({
    where: {
      authorUserId: user.id,
      status: r.query.status
    },
    limit: r.query.limit,
    offset: r.query.offset
  });

  if (!tickets) {
    return error(Errors.NotFound, 'No support tickets found for user', {});
  }

  return output(tickets);
}
