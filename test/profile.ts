import * as Lab from '@hapi/lab';
import { init } from '../src/server';
import { makeAccessToken, makeEmployer, makeWorker } from './index';
import { User } from '../src/server/models/User';
import { expect } from '@hapi/code';

let server = null;
const { it, suite,
  before, after
} = exports.lab = Lab.script();

async function postRequestOnSendReview(accessToken: string, payload: object) {
  return await server.inject({
    method: 'PUT',
    url: '/api/v1/profile/edit',
    payload,
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });
}
async function postRequestOnChangePassword(accessToken: string, payload: object) {
  return await server.inject({
    method: 'PUT',
    url: '/api/v1/profile/change-password',
    payload,
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });
}

async function Should_Ok_When_EmployerEditedProfile() {
  const employer = await makeEmployer();
  const employerAccessToken = await makeAccessToken(employer);
  const payloadForEdit = {
    avatarId: null,
    firstName: "Kirill",
    lastName: "NeIvanov_",
    additionalInfo: {
      CEO: "Test123",
      website: "Test123",
      secondMobileNumber: "+9213453",
      address: "dfgfd",
      company: "Telega",
      socialNetwork: {
        instagram: "@fsdf",
        twitter: "@fsdf",
        linkedin: "@fsdf",
        facebook: "@f"
      }
    }
  };
  const { result } = await postRequestOnSendReview(employerAccessToken, payloadForEdit);
  const employerAfter = await User.findByPk(employer.id, { raw: true });

  expect(result.ok).to.true();
  expect(employerAfter.additionalInfo).to.equal(payloadForEdit.additionalInfo);
  expect(employerAfter.firstName).to.equal(payloadForEdit.firstName);
  expect(employerAfter.lastName).to.equal(payloadForEdit.lastName);
  expect(result.result.dataValues.additionalInfo).to.equal(payloadForEdit.additionalInfo);
  expect(result.result.dataValues.firstName).to.equal(payloadForEdit.firstName);
  expect(result.result.dataValues.lastName).to.equal(payloadForEdit.lastName);

  await employer.ratingStatistic.destroy();
  await employer.destroy();
}
async function Should_Ok_When_WorkerEditedProfile() {
  const worker = await makeWorker();
  const workerAccessToken = await makeAccessToken(worker);
  const payloadForEdit = {
    avatarId: null,
    firstName: "Kirill",
    lastName: "NeIvanov_",
    additionalInfo: {
      secondMobileNumber: "+9213453",
      address: "dfgfd",
      description: "11dfdsfdsfsdfgsd",
      skills: [],
      socialNetwork: {
        instagram: "@fsdf",
        twitter: "@fsdf",
        linkedin: "@fsdf",
        facebook: "@f"
      }
    }
  };
  const { result } = await postRequestOnSendReview(workerAccessToken, payloadForEdit);
  const workerAfter = await User.findByPk(worker.id, { raw: true });

  expect(result.ok).to.true();
  expect(workerAfter.additionalInfo).to.equal(payloadForEdit.additionalInfo);
  expect(workerAfter.firstName).to.equal(payloadForEdit.firstName);
  expect(workerAfter.lastName).to.equal(payloadForEdit.lastName);
  expect(result.result.dataValues.additionalInfo).to.equal(payloadForEdit.additionalInfo);
  expect(result.result.dataValues.firstName).to.equal(payloadForEdit.firstName);
  expect(result.result.dataValues.lastName).to.equal(payloadForEdit.lastName);

  await worker.ratingStatistic.destroy();
  await worker.destroy();
}
async function Should_ValidationError_When_WorkerEditedProfileAndUsingDifferentScheme() {
  const worker = await makeWorker();
  const workerAccessToken = await makeAccessToken(worker);
  const payloadForEdit = {
    avatarId: null,
    firstName: "Kirill",
    lastName: "NeIvanov_",
    additionalInfo: {
      CEO: "Test123",
      website: "Test123",
      secondMobileNumber: "+9213453",
      address: "dfgfd",
      company: "Telega",
      socialNetwork: {
        instagram: "@fsdf",
        twitter: "@fsdf",
        linkedin: "@fsdf",
        facebook: "@f"
      }
    }
  };
  const { result } = await postRequestOnSendReview(workerAccessToken, payloadForEdit);

  expect(result.ok).to.false();
  // expect().to.equal();
  // expect().to.equal();
  // expect().to.equal();

  await worker.ratingStatistic.destroy();
  await worker.destroy();
}
async function Should_ValidationError_When_EmployerEditedProfileAndUsingDifferentScheme() {
  const employer = await makeEmployer();
  const employerAccessToken = await makeAccessToken(employer);
  const payloadForEdit = {
    avatarId: null,
    firstName: "Kirill",
    lastName: "NeIvanov_",
    additionalInfo: {
      secondMobileNumber: "+9213453",
      address: "dfgfd",
      description: "11dfdsfdsfsdfgsd",
      skills: [],
      socialNetwork: {
        instagram: "@fsdf",
        twitter: "@fsdf",
        linkedin: "@fsdf",
        facebook: "@f"
      }
    }
  };
  const { result } = await postRequestOnSendReview(employerAccessToken, payloadForEdit);

  expect(result.ok).to.false();
  // expect().to.equal();
  // expect().to.equal();
  // expect().to.equal();

  await employer.ratingStatistic.destroy();
  await employer.destroy();
}

async function Should_Ok_When_UserChangePassword(user: User) {
  const userAccessToken = await makeAccessToken(user);
  const password = {
    newPassword: '987654321',
    oldPassword: '123456789',
  };
  const { result } = await postRequestOnChangePassword(userAccessToken, password);
  const userAfter = await User.scope("withPassword").findByPk(user.id);

  expect(result.ok).to.true();
  expect(await userAfter.passwordCompare(password.newPassword)).to.true();

  await user.ratingStatistic.destroy();
  await user.destroy();
}
async function Should_Ok_When_UserEnteredWrongPasswordWhenChangingPassword(user: User) {
  const userAccessToken = await makeAccessToken(user);
  const tryPassword = '123456789';
  const password = {
    newPassword: '987654321',
    oldPassword: '_123456789_',
  };
  const { result } = await postRequestOnChangePassword(userAccessToken, password);
  const userAfter = await User.scope("withPassword").findByPk(user.id);

  expect(result.ok).to.false();
  expect(await userAfter.passwordCompare(tryPassword)).to.true();

  await user.ratingStatistic.destroy();
  await user.destroy();
}

suite('Testing API Profile:', () => {
  before(async () => {
    server = await init();
  });

  after(async () => {
    await server.stop();
  });

  it('Edit', async () => {
    await Should_ValidationError_When_EmployerEditedProfileAndUsingDifferentScheme();
    await Should_ValidationError_When_WorkerEditedProfileAndUsingDifferentScheme();
    await Should_Ok_When_WorkerEditedProfile();
    await Should_Ok_When_EmployerEditedProfile();
  });
  it('Change password', async () => {
    await Should_Ok_When_UserChangePassword(await makeEmployer());
    await Should_Ok_When_UserChangePassword(await makeWorker());
    await Should_Ok_When_UserEnteredWrongPasswordWhenChangingPassword(await makeEmployer());
    await Should_Ok_When_UserEnteredWrongPasswordWhenChangingPassword(await makeWorker());
  });
});
