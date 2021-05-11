import { error, output } from '../utils';
import { Errors } from '../utils/errors';
import { Priority, Quest } from '../models/Quest';
import { User, UserRole } from '../models/User';

export async function create(r) {
  const user = r.auth.credentials;

  if (user.role !== UserRole.Employer) {
    return error(Errors.InvalidPayload, "User does not Employer", {});
  }

  await Quest.create({
    userId: user.id,
    category: r.payload.category,
    priority: r.payload.priority,
    location: r.payload.location,
    title: r.payload.title,
    description: r.payload.description,
    price: r.payload.price,
  });

  return output();
}
