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

let server = null;
const { afterEach,
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

async function postRequestOnCreateQuest(accessToken: string) {
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
async function postRequestOnStartQuest(accessToken: string, quest: Quest, assignedWorker: User) {
  return await server.inject({
    method: 'POST',
    url: '/api/v1/quest/' + quest.id + '/start',
    payload: {
      assignedWorkerId: assignedWorker.id
    },
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });
}
async function putRequestOnEditQuest(accessToken: string, quest: Quest, editedQuestData: object) {
  return await server.inject({
    method: 'PUT',
    url: '/api/v1/quest/' + quest.id,
    payload: editedQuestData,
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
async function makeQuest(employer: User, status: QuestStatus) {
  return await Quest.create({
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
}

async function Should_InvalidRole_When_WorkerWantsToCreateQuest() {
  const worker = await makeWorker();
  const workerAccessToken = await makeAccessToken(worker);
  const { result } = await postRequestOnCreateQuest(workerAccessToken);

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.InvalidRole);

  await worker.destroy();
}
async function Should_Ok_When_EmployerWantsToCreateQuest() {
  const employer = await makeEmployer();
  const employerAccessToken = await makeAccessToken(employer);
  const { result } = await postRequestOnCreateQuest(employerAccessToken);
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

async function Should_Ok_When_EmployerWantsToEditQuestAtStatusCreated() {
  const employer = await makeEmployer();
  const employerAccessToken = await makeAccessToken(employer);
  const quest = await makeQuest(employer, QuestStatus.Created);
  const editedQuestData = {
    category: 'It2',
    title: 'Test2',
    description: 'Test2',
    price: '10000',
    priority: QuestPriority.Low,
    location: { longitude: -69.0364, latitude: 40.8951 },
  };
  const { result } = await putRequestOnEditQuest(employerAccessToken, quest, editedQuestData);

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
async function Should_Forbidden_When_OtherUserWantsToEditQuestAtStatusCreated() {
  const employer = await makeEmployer();
  const worker = await makeWorker();
  const workerAccessToken = await makeAccessToken(worker);
  const quest = await makeQuest(employer, QuestStatus.Created);
  const editedQuestData = {
    category: 'It2',
    title: 'Test2',
    description: 'Test2',
    price: '10000',
    priority: QuestPriority.Low,
    location: { longitude: -69.0364, latitude: 40.8951 },
  };
  const { result } = await putRequestOnEditQuest(workerAccessToken, quest, editedQuestData);

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.Forbidden);
  expect(editedQuestData).to.not.equal(await Quest.findByPk(quest.id, { raw: true }), {
    part: true
  });

  await quest.destroy();
  await worker.destroy();
  await employer.destroy();
}
async function Should_InvalidStatus_When_EmployerWantsToEditNonEditableQuestOnStatusOf(status: QuestStatus) {
  expect(status).to.not.equal(QuestStatus.Created);

  const employer = await makeEmployer();
  const employerAccessToken = await makeAccessToken(employer);
  const quest = await makeQuest(employer, status);
  const description = Math.random().toString(36).substring(7);
  const { result } = await putRequestOnEditQuest(employerAccessToken, quest, { description });

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.InvalidStatus);
  expect(quest.description).to.not.equal(description);

  await quest.destroy();
  await employer.destroy();
}

async function Should_Forbidden_When_EmployerStartedQuestButHeNotQuestCreator() {
  const employerCreatorOfQuest = await makeEmployer();
  const employerNotCreatorOfQuest = await makeEmployer();
  const assignedWorker = await makeWorker();
  const accessTokenEmployerNotCreatorOfQuest = await makeAccessToken(employerNotCreatorOfQuest);
  const quest = await makeQuest(employerCreatorOfQuest, QuestStatus.Created);
  const { result } = await postRequestOnStartQuest(accessTokenEmployerNotCreatorOfQuest, quest, assignedWorker);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.Forbidden);
  expect(quest.assignedWorkerId).to.null();
  expect(quest.status).to.equal(QuestStatus.Created);

  await quest.destroy();
  await employerCreatorOfQuest.destroy();
  await employerNotCreatorOfQuest.destroy();
  await assignedWorker.destroy();
}
async function Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusCreated(status: QuestStatus) {
  expect(status).to.not.equal(QuestStatus.Created);

  const employer = await makeEmployer();
  const assignedWorker = await makeWorker();
  const employerAccessToken = await makeAccessToken(employer);
  const quest = await makeQuest(employer, status);
  const { result } = await postRequestOnStartQuest(employerAccessToken, quest, assignedWorker);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.InvalidStatus);
  expect(quest.assignedWorkerId).to.null();
  expect(quest.status).to.equal(status);

  await quest.destroy();
  await employer.destroy();
  await assignedWorker.destroy();
}
async function Should_Ok_When_EmployerStartedQuestAndWorkerResponseOnQuest() {
  const workers = [await makeWorker(), await makeWorker(), await makeWorker()];
  const appointedWorker = workers[0];
  const employer = await makeEmployer();
  const employerAccessToken = await makeAccessToken(employer);
  const quest = await makeQuest(employer, QuestStatus.Created);
  const questsResponses = [
  await QuestsResponse.create({
    workerId: appointedWorker.id,
    questId: quest.id,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Response,
    message: 'Hi!'
  }),
  await QuestsResponse.create({
    workerId: workers[1].id,
    questId: quest.id,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Invite,
    message: 'Hi!'
  }),
  await QuestsResponse.create({
    workerId: workers[2].id,
    questId: quest.id,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Response,
    message: 'Hi!'
  })];
  const acceptedResponse = questsResponses[0];
  const { result } = await postRequestOnStartQuest(employerAccessToken, quest, appointedWorker);

  for (const response of questsResponses) {
    await response.reload();
  }

  await quest.reload();

  expect(result.ok).to.true();
  expect(quest.assignedWorkerId).to.equal(appointedWorker.id);
  expect(quest.status).to.equal(QuestStatus.WaitWorker);

  for (const response of questsResponses) {
    if (response.id !== acceptedResponse.id) {
      expect(response.status).to.equal(QuestsResponseStatus.Closed)
    }
  }

  for (const response of questsResponses) {
    await response.destroy();
  }

  await quest.destroy();
  await employer.destroy();

  for (const worker of workers) {
    await worker.destroy();
  }
}
async function Should_NotFound_When_EmployerStartedQuestAndWorkerNotRespondedOnQuest() {
  const worker = await makeWorker();
  const employer = await makeEmployer();
  const employerAccessToken = await makeAccessToken(employer);
  const quest = await makeQuest(employer, QuestStatus.Created);
  const { result } = await postRequestOnStartQuest(employerAccessToken, quest, worker);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.NotFound);
  expect(quest.assignedWorkerId).to.null();
  expect(quest.status).to.equal(QuestStatus.Created);

  await quest.destroy();
  await worker.destroy();
  await employer.destroy();
}
async function Should_Forbidden_When_EmployerStartedQuestAndWorkerRejectInvite() {
  const workers = [await makeWorker(), await makeWorker(), await makeWorker()];
  const appointedWorker = workers[0];
  const employer = await makeEmployer();
  const employerAccessToken = await makeAccessToken(employer);
  const quest = await makeQuest(employer, QuestStatus.Created);
  const questsResponses = [
    await QuestsResponse.create({
      workerId: appointedWorker.id,
      questId: quest.id,
      status: QuestsResponseStatus.Rejected,
      type: QuestsResponseType.Invite,
      message: 'Hi!'
    }),
    await QuestsResponse.create({
      workerId: workers[1].id,
      questId: quest.id,
      status: QuestsResponseStatus.Accepted,
      type: QuestsResponseType.Invite,
      message: 'Hi!'
    }),
    await QuestsResponse.create({
      workerId: workers[2].id,
      questId: quest.id,
      status: QuestsResponseStatus.Open,
      type: QuestsResponseType.Response,
      message: 'Hi!'
    })];
  const acceptedResponse = questsResponses[0];
  const { result } = await postRequestOnStartQuest(employerAccessToken, quest, appointedWorker);

  for (const response of questsResponses) {
    await response.reload();
  }

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.Forbidden);
  expect(quest.assignedWorkerId).to.null();
  expect(quest.status).to.equal(QuestStatus.Created);
  expect(acceptedResponse.status).to.equal(QuestsResponseStatus.Rejected);

  for (const response of questsResponses) {
    await response.destroy();
  }

  await quest.destroy();
  await employer.destroy();

  for (const worker of workers) {
    await worker.destroy();
  }
}
async function Should_Ok_When_EmployerStartedQuestAndWorkerAcceptInvite() {
  const workers = [await makeWorker(), await makeWorker(), await makeWorker()];
  const appointedWorker = workers[0];
  const employer = await makeEmployer();
  const employerAccessToken = await makeAccessToken(employer);
  const quest = await makeQuest(employer, QuestStatus.Created);
  const questsResponses = [
    await QuestsResponse.create({
      workerId: appointedWorker.id,
      questId: quest.id,
      status: QuestsResponseStatus.Accepted,
      type: QuestsResponseType.Invite,
      message: 'Hi!'
    }),
    await QuestsResponse.create({
      workerId: workers[1].id,
      questId: quest.id,
      status: QuestsResponseStatus.Accepted,
      type: QuestsResponseType.Invite,
      message: 'Hi!'
    }),
    await QuestsResponse.create({
      workerId: workers[2].id,
      questId: quest.id,
      status: QuestsResponseStatus.Open,
      type: QuestsResponseType.Response,
      message: 'Hi!'
    })];
  const acceptedResponse = questsResponses[0];
  const { result } = await postRequestOnStartQuest(employerAccessToken, quest, appointedWorker);

  await quest.reload();

  for (const response of questsResponses) {
    await response.reload();
  }

  expect(result.ok).to.true();
  expect(quest.assignedWorkerId).to.equal(appointedWorker.id);
  expect(quest.status).to.equal(QuestStatus.WaitWorker);

  for (const response of questsResponses) {
    if (response.id !== acceptedResponse.id) {
      expect(response.status).to.equal(QuestsResponseStatus.Closed)
    }
  }

  for (const response of questsResponses) {
    await response.destroy();
  }

  await quest.destroy();
  await employer.destroy();

  for (const worker of workers) {
    await worker.destroy();
  }
}
async function Should_Forbidden_When_EmployerStartedQuestAndWorkerNotResponseOnInvite() {
  const workers = [await makeWorker(), await makeWorker(), await makeWorker()];
  const appointedWorker = workers[0];
  const employer = await makeEmployer();
  const employerAccessToken = await makeAccessToken(employer);
  const quest = await makeQuest(employer, QuestStatus.Created);
  const questsResponses = [
    await QuestsResponse.create({
      workerId: appointedWorker.id,
      questId: quest.id,
      status: QuestsResponseStatus.Open,
      type: QuestsResponseType.Invite,
      message: 'Hi!'
    }),
    await QuestsResponse.create({
      workerId: workers[1].id,
      questId: quest.id,
      status: QuestsResponseStatus.Accepted,
      type: QuestsResponseType.Invite,
      message: 'Hi!'
    }),
    await QuestsResponse.create({
      workerId: workers[2].id,
      questId: quest.id,
      status: QuestsResponseStatus.Open,
      type: QuestsResponseType.Response,
      message: 'Hi!'
    })];
  const acceptedResponse = questsResponses[0];
  const { result } = await postRequestOnStartQuest(employerAccessToken, quest, appointedWorker);

  await quest.reload();

  for (const response of questsResponses) {
    await response.reload();
  }

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.Forbidden);
  expect(quest.assignedWorkerId).to.null();
  expect(quest.status).to.equal(QuestStatus.Created);
  expect(acceptedResponse.status).to.equal(QuestsResponseStatus.Open);

  for (const response of questsResponses) {
    await response.destroy();
  }

  await quest.destroy();
  await employer.destroy();

  for (const worker of workers) {
    await worker.destroy();
  }
}


suite('Testing API Quest:', () => {

  before(async () => {
    server = await init();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('Create (without media)', async () => {
    await Should_InvalidRole_When_WorkerWantsToCreateQuest();
    await Should_Ok_When_EmployerWantsToCreateQuest();
  });
  it('Edit (without media)', async () => {
    await Should_InvalidStatus_When_EmployerWantsToEditNonEditableQuestOnStatusOf(QuestStatus.Active);
    await Should_InvalidStatus_When_EmployerWantsToEditNonEditableQuestOnStatusOf(QuestStatus.Closed);
    await Should_InvalidStatus_When_EmployerWantsToEditNonEditableQuestOnStatusOf(QuestStatus.Dispute);
    await Should_InvalidStatus_When_EmployerWantsToEditNonEditableQuestOnStatusOf(QuestStatus.WaitWorker);
    await Should_InvalidStatus_When_EmployerWantsToEditNonEditableQuestOnStatusOf(QuestStatus.WaitConfirm);

    await Should_Ok_When_EmployerWantsToEditQuestAtStatusCreated();
    await Should_Forbidden_When_OtherUserWantsToEditQuestAtStatusCreated();
  });
  it('Start', async () => {
    await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusCreated(QuestStatus.Active);
    await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusCreated(QuestStatus.Closed);
    await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusCreated(QuestStatus.Dispute);
    await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusCreated(QuestStatus.WaitWorker);
    await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusCreated(QuestStatus.WaitConfirm);

    await Should_Forbidden_When_EmployerStartedQuestButHeNotQuestCreator();
    await Should_Ok_When_EmployerStartedQuestAndWorkerResponseOnQuest();
    await Should_NotFound_When_EmployerStartedQuestAndWorkerNotRespondedOnQuest();
    await Should_Forbidden_When_EmployerStartedQuestAndWorkerRejectInvite();
    await Should_Ok_When_EmployerStartedQuestAndWorkerAcceptInvite();
    await Should_Forbidden_When_EmployerStartedQuestAndWorkerNotResponseOnInvite();
  });
});
