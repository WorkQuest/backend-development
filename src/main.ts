import * as main from './server';
import { init } from './bridge';

try{
  // main.init();
  init();
} catch (e) {
  console.error(e);
}
