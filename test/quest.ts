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
async function postRequestOnEditQuest(accessToken: string, quest: Quest, editedQuestData: object) {
  return await server.inject({
    method: 'PUT',
    url: '/api/v1/quest/' + quest.id,
    payload: editedQuestData,
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });
}
async function postRequestOnCloseQuest(accessToken: string, quest: Quest) {
  return await server.inject({
    method: 'POST',
    url: '/api/v1/quest/' + quest.id + '/close',
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });
}
async function postRequestOnDeleteQuest(accessToken: string, quest: Quest) {
  return await server.inject({
    method: 'DELETE',
    url: '/api/v1/quest/' + quest.id,
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });
}
async function postRequestOnRejectWorkOnQuest(accessToken: string, quest: Quest) {
  return await server.inject({
    method: 'POST',
    url: '/api/v1/quest/' + quest.id + '/reject-work',
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });
}
async function postRequestOnAcceptWorkOnQuest(accessToken: string, quest: Quest) {
  return await server.inject({
    method: 'POST',
    url: '/api/v1/quest/' + quest.id + '/accept-work',
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });
}
async function postRequestOnCompletedWorkOnQuest(accessToken: string, quest: Quest) {
  return await server.inject({
    method: 'POST',
    url: '/api/v1/quest/' + quest.id + '/complete-work',
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });
}
async function postRequestOnAcceptCompletedWorkOnQuest(accessToken: string, quest: Quest) {
  return await server.inject({
    method: 'POST',
    url: '/api/v1/quest/' + quest.id + '/accept-completed-work',
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
async function makeQuest(employer: User, assignedWorker: User, status: QuestStatus) {
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
  const quest = await makeQuest(employer, null, QuestStatus.Created);
  const editedQuestData = {
    category: 'It2',
    title: 'Test2',
    description: 'Test2',
    price: '10000',
    priority: QuestPriority.Low,
    location: { longitude: -69.0364, latitude: 40.8951 },
  };
  const { result } = await postRequestOnEditQuest(employerAccessToken, quest, editedQuestData);

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
  const quest = await makeQuest(employer, null, QuestStatus.Created);
  const editedQuestData = {
    category: 'It2',
    title: 'Test2',
    description: 'Test2',
    price: '10000',
    priority: QuestPriority.Low,
    location: { longitude: -69.0364, latitude: 40.8951 },
  };
  const { result } = await postRequestOnEditQuest(workerAccessToken, quest, editedQuestData);

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.Forbidden);
  expect(editedQuestData).to.not.equal(await Quest.findByPk(quest.id, { raw: true }), {
    part: true
  });

  await quest.destroy();
  await worker.destroy();
  await employer.destroy();
}
async function Should_InvalidStatus_When_EmployerEditQuestAndQuestNotStatusOnCreated(status: QuestStatus) {
  expect(status).to.not.equal(QuestStatus.Created);

  const employer = await makeEmployer();
  const employerAccessToken = await makeAccessToken(employer);
  const quest = await makeQuest(employer, null, status);
  const description = Math.random().toString(36).substring(7);
  const { result } = await postRequestOnEditQuest(employerAccessToken, quest, { description });

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.InvalidStatus);
  expect(quest.description).to.not.equal(description);

  await quest.destroy();
  await employer.destroy();
}

async function Should_Forbidden_When_EmployerClosedQuestButHeNotQuestCreator() {
  const employerCreatorOfQuest = await makeEmployer();
  const employerNotCreatorOfQuest = await makeEmployer();
  const quest = await makeQuest(employerCreatorOfQuest, null, QuestStatus.Created);
  const accessTokenEmployerNotCreatorOfQuest = await makeAccessToken(employerNotCreatorOfQuest);
  const { result } = await postRequestOnCloseQuest(accessTokenEmployerNotCreatorOfQuest, quest);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.Forbidden);
  expect(quest.status).to.equal(QuestStatus.Created);

  await quest.destroy();
  await employerCreatorOfQuest.destroy();
  await employerNotCreatorOfQuest.destroy();
}
async function Should_Ok_When_EmployerClosedQuestOnStatusWaitConfirm() {
  const workers = [await makeWorker(), await makeWorker(), await makeWorker()];
  const employer = await makeEmployer();
  const employerAccessToken = await makeAccessToken(employer);
  const quest = await makeQuest(employer, null, QuestStatus.WaitConfirm);
  const questsResponses = [
    await QuestsResponse.create({
      workerId: workers[0].id,
      questId: quest.id,
      status: QuestsResponseStatus.Open,
      type: QuestsResponseType.Response,
      message: 'Hi!'
    }),
    await QuestsResponse.create({
      workerId: workers[1].id,
      questId: quest.id,
      status: QuestsResponseStatus.Closed,
      type: QuestsResponseType.Invite,
      message: 'Hi!'
    }),
    await QuestsResponse.create({
      workerId: workers[2].id,
      questId: quest.id,
      status: QuestsResponseStatus.Closed,
      type: QuestsResponseType.Response,
      message: 'Hi!'
    })];
  const { result } = await postRequestOnCloseQuest(employerAccessToken, quest);

  await quest.reload();
  for (const response of questsResponses) {
    await response.reload();
  }

  expect(result.ok).to.true();
  expect(quest.status).to.equal(QuestStatus.Closed);
  for (const response of questsResponses) {
    expect(response.status).to.equal(QuestsResponseStatus.Closed);
  }

  for (const response of questsResponses) {
    await response.destroy();
  }
  await quest.destroy();
  for (const worker of workers) {
    await worker.destroy();
  }
  await employer.destroy();
}
async function Should_Ok_When_EmployerClosedQuestOnStatusCreated() {
  const workers = [await makeWorker(), await makeWorker(), await makeWorker()];
  const employer = await makeEmployer();
  const employerAccessToken = await makeAccessToken(employer);
  const quest = await makeQuest(employer, null, QuestStatus.Created);
  const questsResponses = [
    await QuestsResponse.create({
      workerId: workers[0].id,
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
  const { result } = await postRequestOnCloseQuest(employerAccessToken, quest);

  await quest.reload();
  for (const response of questsResponses) {
    await response.reload();
  }

  expect(result.ok).to.true();
  expect(quest.status).to.equal(QuestStatus.Closed);
  for (const response of questsResponses) {
    expect(response.status).to.equal(QuestsResponseStatus.Closed);
  }

  for (const response of questsResponses) {
    await response.destroy();
  }
  await quest.destroy();
  for (const worker of workers) {
    await worker.destroy();
  }
  await employer.destroy();
}
async function Should_InvalidStatus_When_EmployerClosedQuestAndQuestNotStatusOnCreatedOrWaitConfirm(status: QuestStatus) {
  expect(status).to.not.equal(QuestStatus.Created);
  expect(status).to.not.equal(QuestStatus.WaitConfirm);

  const employer = await makeEmployer();
  const quest = await makeQuest(employer, null, status);
  const employerAccessToken = await makeAccessToken(employer);
  const { result } = await postRequestOnCloseQuest(employerAccessToken, quest);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.InvalidStatus);
  expect(quest.assignedWorkerId).to.null();
  expect(quest.status).to.equal(status);

  await quest.destroy();
  await employer.destroy();
}

async function Should_InvalidStatus_When_EmployerDeleteQuestAndQuestNotStatusCreatedOrClosed(status: QuestStatus) {
  expect(status).to.not.equal(QuestStatus.Created);
  expect(status).to.not.equal(QuestStatus.Closed);

  const employer = await makeEmployer();
  const quest = await makeQuest(employer, null, status);
  const employerAccessToken = await makeAccessToken(employer);
  const { result } = await postRequestOnDeleteQuest(employerAccessToken, quest);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.InvalidStatus);
  expect(quest.status).to.equal(status);

  await quest.destroy();
  await employer.destroy();
}
async function Should_Forbidden_When_EmployerDeleteQuestButHeNotQuestCreator() {
  const employerCreatorOfQuest = await makeEmployer();
  const employerNotCreatorOfQuest = await makeEmployer();
  const quest = await makeQuest(employerCreatorOfQuest, null, QuestStatus.Created);
  const accessTokenEmployerNotCreatorOfQuest = await makeAccessToken(employerNotCreatorOfQuest);
  const { result } = await postRequestOnDeleteQuest(accessTokenEmployerNotCreatorOfQuest, quest);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.Forbidden);
  expect(quest).to.not.null();
  expect(quest.status).to.equal(QuestStatus.Created);

  await quest.destroy();
  await employerCreatorOfQuest.destroy();
  await employerNotCreatorOfQuest.destroy();
}
async function Should_Ok_When_EmployerDeleteQuestOnStatusCreated() {
  const workers = [await makeWorker(), await makeWorker(), await makeWorker()];
  const employer = await makeEmployer();
  const quest = await makeQuest(employer, null, QuestStatus.Created);
  const questId = quest.id;

  await QuestsResponse.create({
    workerId: workers[0].id,
    questId: quest.id,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Response,
    message: 'Hi!'
  });
  await QuestsResponse.create({
    workerId: workers[1].id,
    questId: quest.id,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Invite,
    message: 'Hi!'
  });
  await QuestsResponse.create({
    workerId: workers[2].id,
    questId: quest.id,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Response,
    message: 'Hi!'
  });

  const employerAccessToken = await makeAccessToken(employer);
  const { result } = await postRequestOnDeleteQuest(employerAccessToken, quest);
  const responses = await QuestsResponse.findAll({ where: { questId } });

  expect(result.ok).to.true();
  expect(await Quest.findByPk(questId)).to.null();
  expect(responses.length).to.equal(0);
}
async function Should_Ok_When_EmployerDeleteQuestOnStatusClose() {
  const workers = [await makeWorker(), await makeWorker(), await makeWorker()];
  const employer = await makeEmployer();
  const quest = await makeQuest(employer, null, QuestStatus.Closed);
  const questId = quest.id;

  await QuestsResponse.create({
    workerId: workers[0].id,
    questId: quest.id,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Response,
    message: 'Hi!'
  });
  await QuestsResponse.create({
    workerId: workers[2].id,
    questId: quest.id,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Response,
    message: 'Hi!'
  });
  await QuestsResponse.create({
    workerId: workers[1].id,
    questId: quest.id,
    status: QuestsResponseStatus.Open,
    type: QuestsResponseType.Invite,
    message: 'Hi!'
  });

  const employerAccessToken = await makeAccessToken(employer);
  const { result } = await postRequestOnDeleteQuest(employerAccessToken, quest);
  const responses = await QuestsResponse.findAll({ where: { questId } });

  expect(result.ok).to.true();
  expect(await Quest.findByPk(questId)).to.null();
  expect(responses.length).to.equal(0);
}

async function Should_Forbidden_When_EmployerStartedQuestButHeNotQuestCreator() {
  const employerCreatorOfQuest = await makeEmployer();
  const employerNotCreatorOfQuest = await makeEmployer();
  const assignedWorker = await makeWorker();
  const accessTokenEmployerNotCreatorOfQuest = await makeAccessToken(employerNotCreatorOfQuest);
  const quest = await makeQuest(employerCreatorOfQuest, null, QuestStatus.Created);
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
async function Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusOnCreated(status: QuestStatus) {
  expect(status).to.not.equal(QuestStatus.Created);

  const employer = await makeEmployer();
  const assignedWorker = await makeWorker();
  const employerAccessToken = await makeAccessToken(employer);
  const quest = await makeQuest(employer, null, status);
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
  const quest = await makeQuest(employer, null, QuestStatus.Created);
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
  const quest = await makeQuest(employer, null, QuestStatus.Created);
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
  const quest = await makeQuest(employer, null, QuestStatus.Created);
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
  const quest = await makeQuest(employer, null, QuestStatus.Created);
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
  const quest = await makeQuest(employer, null, QuestStatus.Created);
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

async function Should_Forbidden_When_WorkerRejectWorkAndWorkerNotAssignedOnWork() {
  const employer = await makeEmployer();
  const assignedWorker = await makeWorker();
  const notAssignedWorker = await makeWorker();
  const notAssignedWorkerAccessToken = await makeAccessToken(notAssignedWorker);
  const quest = await makeQuest(employer, assignedWorker, QuestStatus.WaitWorker);
  const { result } = await postRequestOnRejectWorkOnQuest(notAssignedWorkerAccessToken, quest);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.Forbidden);
  expect(quest.assignedWorkerId).to.equal(assignedWorker.id);
  expect(quest.status).to.equal(QuestStatus.WaitWorker);

  await quest.destroy();
  await employer.destroy();
  await notAssignedWorker.destroy();
  await assignedWorker.destroy();
}
async function Should_Ok_When_WorkerRejectWorkAndQuestStatusWaitWorker() {
  const employer = await makeEmployer();
  const assignedWorker = await makeWorker();
  const assignedWorkerAccessToken = await makeAccessToken(assignedWorker);
  const quest = await makeQuest(employer, assignedWorker, QuestStatus.WaitWorker);
  const { result } = await postRequestOnRejectWorkOnQuest(assignedWorkerAccessToken, quest);

  await quest.reload();

  expect(result.ok).to.true();
  expect(quest.assignedWorkerId).to.null()
  expect(quest.status).to.equal(QuestStatus.Created);

  await quest.destroy();
  await employer.destroy();
  await assignedWorker.destroy();
}
async function Should_InvalidStatus_When_WorkerRejectWorkAndQuestNotStatusOnWaitWorker(status: QuestStatus) {
  expect(status).to.not.equal(QuestStatus.WaitWorker);

  const employer = await makeEmployer();
  const assignedWorker = await makeWorker();
  const assignedWorkerAccessToken = await makeAccessToken(assignedWorker);
  const quest = await makeQuest(employer, assignedWorker, status);
  const { result } = await postRequestOnRejectWorkOnQuest(assignedWorkerAccessToken, quest);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.InvalidStatus);
  expect(quest.assignedWorkerId).to.equal(assignedWorker.id);
  expect(quest.status).to.equal(status);

  await quest.destroy();
  await employer.destroy();
  await assignedWorker.destroy();
}

async function Should_Forbidden_When_WorkerAcceptWorkAndWorkerNotAssignedOnWork() {
  const employer = await makeEmployer();
  const assignedWorker = await makeWorker();
  const notAssignedWorker = await makeWorker();
  const notAssignedWorkerAccessToken = await makeAccessToken(notAssignedWorker);
  const quest = await makeQuest(employer, assignedWorker, QuestStatus.WaitWorker);
  const { result } = await postRequestOnAcceptWorkOnQuest(notAssignedWorkerAccessToken, quest);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.Forbidden);
  expect(quest.assignedWorkerId).to.equal(assignedWorker.id);
  expect(quest.status).to.equal(QuestStatus.WaitWorker);

  await quest.destroy();
  await employer.destroy();
  await notAssignedWorker.destroy();
  await assignedWorker.destroy();
}
async function Should_Ok_When_WorkerAcceptWorkAndQuestStatusWaitWorker() {
  const employer = await makeEmployer();
  const assignedWorker = await makeWorker();
  const assignedWorkerAccessToken = await makeAccessToken(assignedWorker);
  const quest = await makeQuest(employer, assignedWorker, QuestStatus.WaitWorker);
  const { result } = await postRequestOnAcceptWorkOnQuest(assignedWorkerAccessToken, quest);

  await quest.reload();

  expect(result.ok).to.true();
  expect(quest.assignedWorkerId).to.equal(assignedWorker.id);
  expect(quest.status).to.equal(QuestStatus.Active);

  await quest.destroy();
  await employer.destroy();
  await assignedWorker.destroy();
}
async function Should_InvalidStatus_When_WorkerAcceptWorkAndQuestNotStatusOnWaitWorker(status: QuestStatus) {
  expect(status).to.not.equal(QuestStatus.WaitWorker);

  const employer = await makeEmployer();
  const assignedWorker = await makeWorker();
  const assignedWorkerAccessToken = await makeAccessToken(assignedWorker);
  const quest = await makeQuest(employer, assignedWorker, status);
  const { result } = await postRequestOnAcceptWorkOnQuest(assignedWorkerAccessToken, quest);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.InvalidStatus);
  expect(quest.assignedWorkerId).to.equal(assignedWorker.id);
  expect(quest.status).to.equal(status);

  await quest.destroy();
  await employer.destroy();
  await assignedWorker.destroy();
}

async function Should_Forbidden_When_WorkerCompletedWorkAndWorkerNotAssignedOnWork() {
  const employer = await makeEmployer();
  const assignedWorker = await makeWorker();
  const notAssignedWorker = await makeWorker();
  const notAssignedWorkerAccessToken = await makeAccessToken(notAssignedWorker);
  const quest = await makeQuest(employer, assignedWorker, QuestStatus.Active);
  const { result } = await postRequestOnCompletedWorkOnQuest(notAssignedWorkerAccessToken, quest);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.Forbidden);
  expect(quest.assignedWorkerId).to.equal(assignedWorker.id);
  expect(quest.status).to.equal(QuestStatus.Active);

  await quest.destroy();
  await employer.destroy();
  await notAssignedWorker.destroy();
  await assignedWorker.destroy();
}
async function Should_Ok_When_WorkerCompletedWorkAndQuestStatusActive() {
  const employer = await makeEmployer();
  const assignedWorker = await makeWorker();
  const assignedWorkerAccessToken = await makeAccessToken(assignedWorker);
  const quest = await makeQuest(employer, assignedWorker, QuestStatus.Active);
  const { result } = await postRequestOnCompletedWorkOnQuest(assignedWorkerAccessToken, quest);

  await quest.reload();

  expect(result.ok).to.true();
  expect(quest.assignedWorkerId).to.equal(assignedWorker.id);
  expect(quest.status).to.equal(QuestStatus.WaitConfirm);

  await quest.destroy();
  await employer.destroy();
  await assignedWorker.destroy();
}
async function Should_InvalidStatus_When_WorkerCompletedWorkAndQuestNotStatusOnActive(status: QuestStatus) {
  expect(status).to.not.equal(QuestStatus.Active);

  const employer = await makeEmployer();
  const assignedWorker = await makeWorker();
  const assignedWorkerAccessToken = await makeAccessToken(assignedWorker);
  const quest = await makeQuest(employer, assignedWorker, status);
  const { result } = await postRequestOnCompletedWorkOnQuest(assignedWorkerAccessToken, quest);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.InvalidStatus);
  expect(quest.assignedWorkerId).to.equal(assignedWorker.id);
  expect(quest.status).to.equal(status);

  await quest.destroy();
  await employer.destroy();
  await assignedWorker.destroy();
}

async function Should_Forbidden_When_EmployerAcceptCompletedWorkAndEmployerNotQuestCreator() {
  const assignedWorker = await makeWorker();
  const employerCreatorOfQuest = await makeEmployer();
  const employerNotCreatorOfQuest = await makeEmployer();
  const accessTokenEmployerNotCreatorOfQuest = await makeAccessToken(employerNotCreatorOfQuest);
  const quest = await makeQuest(employerCreatorOfQuest, assignedWorker, QuestStatus.WaitConfirm);
  const { result } = await postRequestOnAcceptCompletedWorkOnQuest(accessTokenEmployerNotCreatorOfQuest, quest);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.Forbidden);
  expect(quest.assignedWorkerId).to.equal(assignedWorker.id);
  expect(quest.status).to.equal(QuestStatus.WaitConfirm);

  await quest.destroy();
  await assignedWorker.destroy();
  await employerCreatorOfQuest.destroy();
  await employerNotCreatorOfQuest.destroy();
}
async function Should_Ok_When_EmployerAcceptCompletedWorkAndQuestStatusWaitConfirm() {
  const employer = await makeEmployer();
  const assignedWorker = await makeWorker();
  const employerAccessToken = await makeAccessToken(employer);
  const quest = await makeQuest(employer, assignedWorker, QuestStatus.WaitConfirm);
  const { result } = await postRequestOnAcceptCompletedWorkOnQuest(employerAccessToken, quest);

  await quest.reload();

  expect(result.ok).to.true();
  expect(quest.assignedWorkerId).to.equal(assignedWorker.id);
  expect(quest.status).to.equal(QuestStatus.Closed);

  await quest.destroy();
  await employer.destroy();
  await assignedWorker.destroy();
}
async function Should_InvalidStatus_When_EmployerAcceptCompletedWorkAndQuestNotStatusOnWaitConfirm(status: QuestStatus) {
  expect(status).to.not.equal(QuestStatus.WaitConfirm);

  const employer = await makeEmployer();
  const assignedWorker = await makeWorker();
  const employerAccessToken = await makeAccessToken(employer);
  const quest = await makeQuest(employer, assignedWorker, status);
  const { result } = await postRequestOnAcceptCompletedWorkOnQuest(employerAccessToken, quest);

  await quest.reload();

  expect(result.ok).to.false();
  expect(result.code).to.equal(Errors.InvalidStatus);
  expect(quest.assignedWorkerId).to.equal(assignedWorker.id);
  expect(quest.status).to.equal(status);

  await quest.destroy();
  await employer.destroy();
  await assignedWorker.destroy();
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
    await Should_InvalidStatus_When_EmployerEditQuestAndQuestNotStatusOnCreated(QuestStatus.Active);
    await Should_InvalidStatus_When_EmployerEditQuestAndQuestNotStatusOnCreated(QuestStatus.Closed);
    await Should_InvalidStatus_When_EmployerEditQuestAndQuestNotStatusOnCreated(QuestStatus.Dispute);
    await Should_InvalidStatus_When_EmployerEditQuestAndQuestNotStatusOnCreated(QuestStatus.WaitWorker);
    await Should_InvalidStatus_When_EmployerEditQuestAndQuestNotStatusOnCreated(QuestStatus.WaitConfirm);

    await Should_Ok_When_EmployerWantsToEditQuestAtStatusCreated();
    await Should_Forbidden_When_OtherUserWantsToEditQuestAtStatusCreated();
  });
  it('Close', async () => {
    await Should_InvalidStatus_When_EmployerClosedQuestAndQuestNotStatusOnCreatedOrWaitConfirm(QuestStatus.Active);
    await Should_InvalidStatus_When_EmployerClosedQuestAndQuestNotStatusOnCreatedOrWaitConfirm(QuestStatus.Closed);
    await Should_InvalidStatus_When_EmployerClosedQuestAndQuestNotStatusOnCreatedOrWaitConfirm(QuestStatus.Dispute);
    await Should_InvalidStatus_When_EmployerClosedQuestAndQuestNotStatusOnCreatedOrWaitConfirm(QuestStatus.WaitWorker);

    await Should_Ok_When_EmployerClosedQuestOnStatusCreated();
    await Should_Ok_When_EmployerClosedQuestOnStatusWaitConfirm();
    await Should_Forbidden_When_EmployerClosedQuestButHeNotQuestCreator();
  });
  it('Delete', async () => {
    await Should_InvalidStatus_When_EmployerDeleteQuestAndQuestNotStatusCreatedOrClosed(QuestStatus.Active);
    await Should_InvalidStatus_When_EmployerDeleteQuestAndQuestNotStatusCreatedOrClosed(QuestStatus.Dispute);
    await Should_InvalidStatus_When_EmployerDeleteQuestAndQuestNotStatusCreatedOrClosed(QuestStatus.WaitWorker);
    await Should_InvalidStatus_When_EmployerDeleteQuestAndQuestNotStatusCreatedOrClosed(QuestStatus.WaitConfirm);

    await Should_Forbidden_When_EmployerDeleteQuestButHeNotQuestCreator();
    await Should_Ok_When_EmployerDeleteQuestOnStatusCreated();
    await Should_Ok_When_EmployerDeleteQuestOnStatusClose();
  });
  it('Start', async () => {
    await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusOnCreated(QuestStatus.Active);
    await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusOnCreated(QuestStatus.Closed);
    await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusOnCreated(QuestStatus.Dispute);
    await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusOnCreated(QuestStatus.WaitWorker);
    await Should_InvalidStatus_When_EmployerStartedQuestAndQuestNotStatusOnCreated(QuestStatus.WaitConfirm);

    await Should_Forbidden_When_EmployerStartedQuestButHeNotQuestCreator();
    await Should_Ok_When_EmployerStartedQuestAndWorkerResponseOnQuest();
    await Should_NotFound_When_EmployerStartedQuestAndWorkerNotRespondedOnQuest();
    await Should_Forbidden_When_EmployerStartedQuestAndWorkerRejectInvite();
    await Should_Ok_When_EmployerStartedQuestAndWorkerAcceptInvite();
    await Should_Forbidden_When_EmployerStartedQuestAndWorkerNotResponseOnInvite();
  });
  it('Reject Work', async () => {
    await Should_InvalidStatus_When_WorkerRejectWorkAndQuestNotStatusOnWaitWorker(QuestStatus.Active);
    await Should_InvalidStatus_When_WorkerRejectWorkAndQuestNotStatusOnWaitWorker(QuestStatus.Closed);
    await Should_InvalidStatus_When_WorkerRejectWorkAndQuestNotStatusOnWaitWorker(QuestStatus.Dispute);
    await Should_InvalidStatus_When_WorkerRejectWorkAndQuestNotStatusOnWaitWorker(QuestStatus.Created);
    await Should_InvalidStatus_When_WorkerRejectWorkAndQuestNotStatusOnWaitWorker(QuestStatus.WaitConfirm);

    await Should_Forbidden_When_WorkerRejectWorkAndWorkerNotAssignedOnWork();
    await Should_Ok_When_WorkerRejectWorkAndQuestStatusWaitWorker();
  });
  it('Accept Work', async () => {
    await Should_InvalidStatus_When_WorkerAcceptWorkAndQuestNotStatusOnWaitWorker(QuestStatus.Active);
    await Should_InvalidStatus_When_WorkerAcceptWorkAndQuestNotStatusOnWaitWorker(QuestStatus.Closed);
    await Should_InvalidStatus_When_WorkerAcceptWorkAndQuestNotStatusOnWaitWorker(QuestStatus.Dispute);
    await Should_InvalidStatus_When_WorkerAcceptWorkAndQuestNotStatusOnWaitWorker(QuestStatus.Created);
    await Should_InvalidStatus_When_WorkerAcceptWorkAndQuestNotStatusOnWaitWorker(QuestStatus.WaitConfirm);

    await Should_Forbidden_When_WorkerAcceptWorkAndWorkerNotAssignedOnWork();
    await Should_Ok_When_WorkerAcceptWorkAndQuestStatusWaitWorker();
  });
  it('Complete Work', async () => {
    await Should_InvalidStatus_When_WorkerCompletedWorkAndQuestNotStatusOnActive(QuestStatus.WaitWorker);
    await Should_InvalidStatus_When_WorkerCompletedWorkAndQuestNotStatusOnActive(QuestStatus.Closed);
    await Should_InvalidStatus_When_WorkerCompletedWorkAndQuestNotStatusOnActive(QuestStatus.Dispute);
    await Should_InvalidStatus_When_WorkerCompletedWorkAndQuestNotStatusOnActive(QuestStatus.Created);
    await Should_InvalidStatus_When_WorkerCompletedWorkAndQuestNotStatusOnActive(QuestStatus.WaitConfirm);

    await Should_Forbidden_When_WorkerCompletedWorkAndWorkerNotAssignedOnWork();
    await Should_Ok_When_WorkerCompletedWorkAndQuestStatusActive();
  });
  it('Accept completed work', async () => {
    await Should_InvalidStatus_When_EmployerAcceptCompletedWorkAndQuestNotStatusOnWaitConfirm(QuestStatus.WaitWorker);
    await Should_InvalidStatus_When_EmployerAcceptCompletedWorkAndQuestNotStatusOnWaitConfirm(QuestStatus.Closed);
    await Should_InvalidStatus_When_EmployerAcceptCompletedWorkAndQuestNotStatusOnWaitConfirm(QuestStatus.Dispute);
    await Should_InvalidStatus_When_EmployerAcceptCompletedWorkAndQuestNotStatusOnWaitConfirm(QuestStatus.Created);
    await Should_InvalidStatus_When_EmployerAcceptCompletedWorkAndQuestNotStatusOnWaitConfirm(QuestStatus.Active);

    await Should_Forbidden_When_EmployerAcceptCompletedWorkAndEmployerNotQuestCreator();
    await Should_Ok_When_EmployerAcceptCompletedWorkAndQuestStatusWaitConfirm();
  });
});
