import * as Lab from '@hapi/lab';
import { init } from '../src/server';
import { makeAccessToken, makeEmployer, makeQuest, makeWorker } from './index';
import { QuestStatus } from '../src/server/models/Quest';
import { Review } from '../src/server/models/Review';
import { expect } from '@hapi/code';

let server = null;
const { it, suite,
  before, after
} = exports.lab = Lab.script();

async function postRequestOnSendReview(accessToken: string, payload: object) {
  return await server.inject({
    method: 'POST',
    url: '/api/v1/review/send',
    payload,
    headers: {
      authorization: 'Bearer ' + accessToken
    },
  });
}

async function Should_Ok_When_WorkerSentReviewToEmployer() {
  const employer = await makeEmployer();
  const worker = await makeWorker();
  const quest = await makeQuest(employer, worker, QuestStatus.Done);
  const workerAccessToken = await makeAccessToken(worker);
  const reviewData = {
    questId: quest.id,
    message: 'Norm',
    mark: 3,
  }
  const { result } = await postRequestOnSendReview(workerAccessToken, reviewData);

  const reviews = await Review.findAll({
    where: { toUserId: employer.id },
    raw: true
  });

  expect(reviews.length).to.equal(1);

  const review = reviews[0];

  expect(review.id).to.equal(result.result.id);
  expect(reviewData).to.equal(review, {
    part: true
  });

  await Review.destroy({ where: { id: review.id } });
  await quest.destroy();
  await employer.destroy();
  await worker.destroy();
}
async function Should_Ok_When_EmployerSentReviewToWorker() {
  const employer = await makeEmployer();
  const worker = await makeWorker();
  const quest = await makeQuest(employer, worker, QuestStatus.Done);
  const employerAccessToken = await makeAccessToken(employer);
  const reviewData = {
    questId: quest.id,
    message: 'Norm',
    mark: 3,
  }
  const { result } = await postRequestOnSendReview(employerAccessToken, reviewData);

  const reviews = await Review.findAll({
    where: { toUserId: worker.id },
    raw: true
  });

  expect(reviews.length).to.equal(1);

  const review = reviews[0];

  expect(review.id).to.equal(result.result.id);
  expect(reviewData).to.equal(review, {
    part: true
  });

  await Review.destroy({ where: { id: review.id } });
  await quest.destroy();
  await employer.destroy();
  await worker.destroy();
}

suite('Testing API Review:', () => {
  before(async () => {
    server = await init();
  });

  after(async () => {
    await server.stop();
  });

  it('Send', async () => {
    await Should_Ok_When_WorkerSentReviewToEmployer();
    await Should_Ok_When_EmployerSentReviewToWorker();
  });
});
