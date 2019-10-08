import * as api from '../api/public';
import * as scheme from '../schemes';

const routes = [
  {
    method: 'GET',
    path: '/api',
    handler: (request, h) => {
      return { success: true };
    },
    options: {
      description: 'Home',
      notes: 'Default route',
      tags: ['api', 'REST', 'SOCKET']
    }
  },
  {
    method: 'POST',
    path: '/api/register',
    handler: api.user.register,
    options: {
      description: 'User registration',
      notes: 'User registration',
      tags: ['api', 'REST', 'SOCKET'],
      validate: {}
    }
  },
  {
    method: 'POST',
    path: '/api/confirmation',
    handler: api.user.confirmation,
    options: {
      description: 'User registration confirmation',
      notes: 'User registration confirmation',
      tags: ['api', 'REST', 'SOCKET'],
      validate: {}
    }
  },
  {
    method: 'POST',
    path: '/api/login',
    options: {
      handler: api.user.login,
      description: 'Login',
      notes: 'Login',
      tags: ['api', 'REST', 'SOCKET'],
      validate: {
        payload: scheme.user
      }
    }
  }
];

export default routes;
