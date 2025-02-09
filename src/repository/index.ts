import EventRepository from './event';
import UserRepository from './user';
import {ServiceCart} from '../enum';

export default {
  [ServiceCart.EVENT]: EventRepository,
  [ServiceCart.USER]: UserRepository,
}
