import { output } from '../../utils';

export async function getUser(r) {
  return output({firstName: 'John', lastName: 'Smith'})
}
