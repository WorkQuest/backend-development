import { User, UserRole, UserStatus } from '../src/server/models/User';
import { Session } from '../src/server/models/Session';
import { generateJwt } from '../src/server/utils/auth';
import { Quest, QuestPriority, QuestStatus } from '../src/server/models/Quest';
import { transformToGeoPostGIS } from '../src/server/utils/quest';
import { RatingStatistic } from '../src/server/models/RatingStatistic';

export async function makeAccessToken(user: User): Promise<string> {
  const session = await Session.create({
    userId: user.id
  });

  const { access } = generateJwt({ id: session.id });

  return access;
}
export async function makeUser(role: UserRole, additionalInfo: object): Promise<User> {
  const user = await User.create({
    email: Math.random().toString(30).substring(7),
    password: '123456789', role,
    firstName: 'TEST', lastName: 'TEST',
    status: UserStatus.Confirmed,
    additionalInfo,
    settings: {
      emailConfirm: null,
    }
  });
  await RatingStatistic.create({ userId: user.id });

  return await User.findByPk(user.id);
}
export async function makeEmployer() {
  return await makeUser(UserRole.Employer, {
    company: 'test',
    CEO: 'test',
    website: 'test',
    secondMobileNumber: '+834534',
    address: 'ghwwf',
    description: 'ghwwf',
    skills: [],
    socialNetwork: {
      instagram: '@test',
      twitter: '@test',
      linkedin: '@test',
      facebook: '@test',
    },
  });
}
export async function makeWorker() {
  return await makeUser(UserRole.Worker, {
    secondMobileNumber: '+834534',
    address: 'ghwwf',
    description: 'ghwwf',
    skills: [],
    socialNetwork: {
      instagram: '@test',
      twitter: '@test',
      linkedin: '@test',
      facebook: '@test',
    },
  });
}
export async function makeQuest(employer: User, assignedWorker: User, status: QuestStatus) {
  return await Quest.create({
    userId: employer.id,
    assignedWorkerId: assignedWorker ? assignedWorker.id : null,
    status: status,
    category: 'It',
    priority: QuestPriority.Normal,
    location: { longitude: -75.0364, latitude: 33.8951 },
    locationPostGIS: transformToGeoPostGIS({
      longitude: -75.0364, latitude: 33.8951
    }),
    title: 'Test',
    description: 'Test',
    price: '10',
    medias: []
  });
}
