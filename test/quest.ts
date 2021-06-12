import * as Lab from '@hapi/lab';
import { expect } from '@hapi/code';
import { init } from '../src/server';
import { User, UserRole, UserStatus } from '../src/server/models/User';
import { Session } from '../src/server/models/Session';
import { generateJwt } from '../src/server/utils/auth';
import { Errors } from '../src/server/utils/errors';
import { Quest, QuestPriority, QuestStatus } from '../src/server/models/Quest';
import { transformToGeoPostGIS } from '../src/server/utils/quest';
import { QuestsResponse, QuestsResponseStatus, QuestsResponseType } from '../src/server/models/QuestsResponse';

const { afterEach,
  beforeEach,
  describe,
  it, suite,
  before
} = exports.lab = Lab.script();

async function makeUser(role: UserRole): Promise<User> {
  return await User.create({
    email: Math.random().toString(30).substring(7),
    password: null, role,
    firstName: 'TEST', lastName: 'TEST',
    status: UserStatus.Confirmed,
    settings: {
      emailConfirm: null,
    }
  });
}
async function makeEmployer() {
  return await makeUser(UserRole.Employer);
}
async function makeWorker() {
  return await makeUser(UserRole.Worker);
}

async function postRequestOnCreateQuest(accessToken: string, server) {
  return await server.inject({
    method: 'POST',
    url: '/api/v1/quest/create',
    payload: {
      category: 'Test',
      priority: QuestPriority.Normal,
      location: {
        longitude: -77.0364,
        latitude: 38.8951,
      },
      title: 'Test',
      description: 'Test',
      price: '1000',
    },
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });
}

async function makeAccessToken(user: User): Promise<string> {
  const session = await Session.create({
    userId: user.id
  });

  const { access } = generateJwt({ id: session.id });

  return access;
}

async function Should_InvalidRole_When_WorkerWantsToCreateQuest(server) {
  const worker = await makeWorker();
  const accessToken = await makeAccessToken(worker);
  const { result } = await postRequestOnCreateQuest(accessToken, server);

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.InvalidRole);

  await worker.destroy();
}
async function Should_Ok_When_EmployerWantsToCreateQuest(server) {
  const employer = await makeEmployer();
  const accessToken = await makeAccessToken(employer);
  const { result } = await postRequestOnCreateQuest(accessToken, server);
  const questFromResponse = result.result;
  const quest = await Quest.findByPk(questFromResponse.id);

  expect(result.ok).to.true();
  expect(quest).to.not.null();
  expect(quest.userId).to.equal(employer.id);
  expect(quest.assignedWorkerId).to.null();
  expect(quest.userId).to.equal(employer.id);

  await quest.destroy();
  await employer.destroy();
}

async function Should_Ok_When_EmployerWantsToEditQuestAtStatusCreated(server) {
  const employer = await makeEmployer();
  const accessToken = await makeAccessToken(employer);
  const quest = await Quest.create({
    userId: employer.id,
    status: QuestStatus.Created,
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
  const editedQuestData = {
    category: 'It2',
    title: 'Test2',
    description: 'Test2',
    price: '10000',
    priority: QuestPriority.Low,
    location: { longitude: -69.0364, latitude: 40.8951 },
  };

  const { result } = await server.inject({
    method: 'PUT',
    url: '/api/v1/quest/' + quest.id,
    payload: editedQuestData,
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });

  expect(result.ok).to.true();
  expect(editedQuestData).to.equal(result.result.dataValues, {
    part: true
  });
  expect(editedQuestData).to.equal(await Quest.findByPk(quest.id, { raw: true }), {
    part: true
  });

  await quest.destroy();
  await employer.destroy();
}
async function Should_Forbidden_When_OtherUserWantsToEditQuestAtStatusCreated(server) {
  const employer = await makeEmployer();
  const worker = await makeWorker();
  const accessTokenWorker = await makeAccessToken(worker);
  const editedQuestData = {
    category: 'It2',
    title: 'Test2',
    description: 'Test2',
    price: '10000',
    priority: QuestPriority.Low,
    location: { longitude: -69.0364, latitude: 40.8951 },
  };
  const quest = await Quest.create({
    userId: employer.id,
    status: QuestStatus.Created,
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

  const { result } = await server.inject({
    method: 'PUT',
    url: '/api/v1/quest/' + quest.id,
    payload: editedQuestData,
    headers: {
      authorization: 'Bearer ' + accessTokenWorker
    },
  });

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.Forbidden);
  expect(editedQuestData).to.not.equal(await Quest.findByPk(quest.id, { raw: true }), {
    part: true
  });

  await quest.destroy();
  await worker.destroy();
  await employer.destroy();
}
async function Should_InvalidStatus_When_EmployerWantsToEditNonEditableQuestOnStatusOf(server, status: QuestStatus) {
  expect(status).to.not.equal(QuestStatus.Created);

  const employer = await makeEmployer();
  const accessToken = await makeAccessToken(employer);
  const quest = await Quest.create({
    userId: employer.id,
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

  const description = Math.random().toString(36).substring(7);
  const { result } = await server.inject({
    method: 'PUT',
    url: '/api/v1/quest/' + quest.id,
    payload: { description },
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.InvalidStatus);
  expect(quest.description).to.not.equal(description);

  await quest.destroy();
  await employer.destroy();
}

async function Should_Forbidden_When_EmployerStartedQuestButHeNotQuestCreator(server) {
  const employerCreatorOfQuest = await makeEmployer();
  const employerNotCreatorOfQuest = await makeEmployer();
  const assignedWorker = await makeWorker();
  const accessTokenEmployerNotCreatorOfQuest = await makeAccessToken(employerNotCreatorOfQuest);
  const quest = await Quest.create({
    userId: employerCreatorOfQuest.id,
    status: QuestStatus.Created,
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

  const { result } = await server.inject({
    method: 'POST',
    url: '/api/v1/quest/' + quest.id + '/start',
    payload: {
      assignedWorkerId: assignedWorker.id
    },
    headers: {
      authorization: 'Bearer ' + accessTokenEmployerNotCreatorOfQuest
    },
  });

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.Forbidden);

  await quest.destroy();
  await employerCreatorOfQuest.destroy();
  await employerNotCreatorOfQuest.destroy();
  await assignedWorker.destroy();
}
async function Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusCreated(server, status: QuestStatus) {
  expect(status).to.not.equal(QuestStatus.Created);

  const employer = await makeEmployer();
  const assignedWorker = await makeWorker();
  const accessToken = await makeAccessToken(employer);
  const quest = await Quest.create({
    userId: employer.id,
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

  const { result } = await server.inject({
    method: 'POST',
    url: '/api/v1/quest/' + quest.id + '/start',
    payload: {
      assignedWorkerId: assignedWorker.id
    },
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.InvalidStatus);

  await quest.destroy();
  await employer.destroy();
  await assignedWorker.destroy();
}
async function Should_Ok_When_EmployerStartedQuestAndWorkerResponseOnQuest(server) {
  const employer = await makeEmployer();
  const worker = await makeWorker();
  const accessToken = await makeAccessToken(employer);
  const quest = await Quest.create({
    userId: employer.id,
    status: QuestStatus.Created,
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
  const questsResponse = await QuestsResponse.create({
    workerId: worker.id,
    questId: quest.id,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Response,
    message: 'Hi!'
  });

  const { result } = await server.inject({
    method: 'POST',
    url: '/api/v1/quest/' + quest.id + '/start',
    payload: {
      assignedWorkerId: worker.id
    },
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });

  await quest.reload();

  expect(result.ok).to.true();
  expect(quest.assignedWorkerId).to.equal(worker.id);
  expect(quest.status).to.equal(QuestStatus.WaitWorker);

  await questsResponse.destroy();
  await quest.destroy();
  await worker.destroy();
  await employer.destroy();
}
async function Should_NotFound_When_EmployerStartedQuestAndWorkerNotRespondedOnQuest(server) {

}
async function Should_Forbidden_When_EmployerStartedQuestAndWorkerRejectInvite(server) {

}
async function Should_Ok_When_EmployerStartedQuestAndWorkerAcceptInvite(server) {

}
async function Should_Forbidden_When_EmployerStartedQuestAndWorkerNotResponseOnInvite(server) {

}



suite('Testing API Quest:', () => {
  let server;

  before(async () => {
    server = await init();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('Create (without media)', async () => {
  //   await Should_InvalidRole_When_WorkerWantsToCreateQuest(server);
  //   await Should_Ok_When_EmployerWantsToCreateQuest(server);
  });
  it('Edit (without media)', async () => {
  //   await Should_InvalidStatus_When_EmployerWantsToEditNonEditableQuestOnStatusOf(server, QuestStatus.Active);
  //   await Should_InvalidStatus_When_EmployerWantsToEditNonEditableQuestOnStatusOf(server, QuestStatus.Closed);
  //   await Should_InvalidStatus_When_EmployerWantsToEditNonEditableQuestOnStatusOf(server, QuestStatus.Dispute);
  //   await Should_InvalidStatus_When_EmployerWantsToEditNonEditableQuestOnStatusOf(server, QuestStatus.WaitWorker);
  //   await Should_InvalidStatus_When_EmployerWantsToEditNonEditableQuestOnStatusOf(server, QuestStatus.WaitConfirm);
  //
  //   await Should_Ok_When_EmployerWantsToEditQuestAtStatusCreated(server);
  //   await Should_Forbidden_When_OtherUserWantsToEditQuestAtStatusCreated(server);
  });
  it('Start', async () => {
    await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusCreated(server, QuestStatus.Active);
    // await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusCreated(server, QuestStatus.Closed);
    // await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusCreated(server, QuestStatus.Dispute);
    // await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusCreated(server, QuestStatus.WaitWorker);
    // await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusCreated(server, QuestStatus.WaitConfirm);

    await Should_Forbidden_When_EmployerStartedQuestButHeNotQuestCreator(server);
    await Should_Ok_When_EmployerStartedQuestAndWorkerResponseOnQuest(server);
    // await Should_NotFound_When_EmployerStartedQuestAndWorkerNotRespondedOnQuest(server);
    // await Should_Forbidden_When_EmployerStartedQuestAndWorkerRejectInvite(server);
    // await Should_Ok_When_EmployerStartedQuestAndWorkerAcceptInvite(server);
    // await Should_Forbidden_When_EmployerStartedQuestAndWorkerNotResponseOnInvite(server);
  });
});
