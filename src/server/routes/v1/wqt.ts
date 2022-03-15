import * as handlers from '../../api/wqt';

export default [{
  method: 'GET',
  path: '/v1/user/me/wqt/delegates',
  handler: handlers.getDelegateVotesChangedEventWqt,
  options: {
    id: 'v1.wqt.getUserDelegates',
    tags: ['api', 'wqt'],
    description: 'Get a list of users to whom the user has delegated',
  }
}]
