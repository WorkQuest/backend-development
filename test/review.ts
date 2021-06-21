import * as Lab from '@hapi/lab';
import { init } from '../src/server';
import { makeAccessToken, makeEmployer, makeQuest, makeWorker } from './index';
import { QuestStatus } from '../src/server/models/Quest';
import { Review } from '../src/server/models/Review';
import { expect } from '@hapi/code';
import { RatingStatistic } from '../src/server/models/RatingStatistic';
import * as updateReviewStatistics from '../src/server/jobs/updateReviewStatistics'

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

  expect(result.ok).to.true();

  // TODO: нужно что-то с Job addUpdateReviewStatisticsJob
  await updateReviewStatistics.default({ ratingStatisticId: employer.ratingStatistic.id });
  const ratingStatisticOfEmployer = await RatingStatistic.findByPk(employer.ratingStatistic.id);
  const reviews = await Review.findAll({
    where: { toUserId: employer.id },
    raw: true
  });

  expect(reviews.length).to.equal(1);
  expect(ratingStatisticOfEmployer.reviewCount).to.equal(1);
  expect(ratingStatisticOfEmployer.averageMark).to.equal(3);

  const review = reviews[0];

  expect(review.id).to.equal(result.result.id);
  expect(reviewData).to.equal(review, {
    part: true
  });

  await Review.destroy({ where: { id: review.id } });
  await employer.ratingStatistic.destroy();
  await worker.ratingStatistic.destroy();
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

  expect(result.ok).to.true();

  // TODO: нужно что-то с Job addUpdateReviewStatisticsJob
  await updateReviewStatistics.default({ ratingStatisticId: worker.ratingStatistic.id });
  const ratingStatisticOfWorker = await RatingStatistic.findByPk(worker.ratingStatistic.id);
  const reviews = await Review.findAll({
    where: { toUserId: worker.id },
    raw: true
  });

  expect(reviews.length).to.equal(1);
  expect(ratingStatisticOfWorker.reviewCount).to.equal(1);
  expect(ratingStatisticOfWorker.averageMark).to.equal(3);

  const review = reviews[0];

  expect(review.id).to.equal(result.result.id);
  expect(reviewData).to.equal(review, {
    part: true
  });

  await Review.destroy({ where: { id: review.id } });
  await employer.ratingStatistic.destroy();
  await worker.ratingStatistic.destroy();
  await ratingStatisticOfWorker.destroy();
  await quest.destroy();
  await employer.destroy();
  await worker.destroy();
}

async function Should_Ok_When_AnyEmployersSentReviewToWorker() {
  const worker = await makeWorker();
  const firstEmployer = await makeEmployer();
  const secondEmployer = await makeEmployer();
  const questOfFirstEmployer  = await makeQuest(firstEmployer, worker, QuestStatus.Done);
  const questOfSecondEmployer = await makeQuest(secondEmployer, worker, QuestStatus.Done);
  const firstEmployerAccessToken = await makeAccessToken(firstEmployer);
  const secondEmployerAccessToken = await makeAccessToken(secondEmployer);
  const reviewOfFirstEmployerData = {
    questId: questOfFirstEmployer.id,
    message: 'Norm',
    mark: 4,
  };
  const reviewOfSecondEmployerData = {
    questId: questOfSecondEmployer.id,
    message: 'Norm2',
    mark: 3,
  };
  const firstEmployerResponse = await postRequestOnSendReview(firstEmployerAccessToken, reviewOfFirstEmployerData);
  const secondEmployerResponse = await postRequestOnSendReview(secondEmployerAccessToken, reviewOfSecondEmployerData);

  expect(firstEmployerResponse.result.ok).to.true();
  expect(secondEmployerResponse.result.ok).to.true();

  // TODO: нужно что-то с Job addUpdateReviewStatisticsJob
  await updateReviewStatistics.default({ ratingStatisticId: worker.ratingStatistic.id });
  const ratingStatisticOfWorker = await RatingStatistic.findByPk(worker.ratingStatistic.id);
  const reviews = await Review.findAll({
    where: { toUserId: worker.id },
    raw: true
  });

  expect(reviews.length).to.equal(2);
  expect(ratingStatisticOfWorker.reviewCount).to.equal(2);
  expect(ratingStatisticOfWorker.averageMark).to.equal(3.5);

  await questOfFirstEmployer.destroy();
  await questOfSecondEmployer.destroy();
  await worker.ratingStatistic.destroy();
  await firstEmployer.ratingStatistic.destroy();
  await secondEmployer.ratingStatistic.destroy();
  await worker.destroy();
  await firstEmployer.destroy();
  await secondEmployer.destroy();
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
  it('Rating statistic ', async () => {
    await Should_Ok_When_AnyEmployersSentReviewToWorker();
  });
});
