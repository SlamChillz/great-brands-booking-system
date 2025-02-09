import { User } from '../database/entity';
import {TRegisterUser} from '../types';
import { ServiceCart } from '../enum';
import { db } from '../database';

export default class UserRepository {
  public name = ServiceCart.USER;
  private static ur = db.client.getRepository(User);

  // constructor(private dbClient: DataSource) {
  //   this.ur = dbClient.getRepository(User);
  // }

  public static async create(payload: TRegisterUser): Promise< Omit<User, "password">> {
    const user = new User();
    user.username = payload.username.toLowerCase();
    user.password = payload.password;
    await UserRepository.ur.save(user);
    return user;
  }

  public static async userByName(username: string): Promise<Omit<User, "password"> | null> {
    return UserRepository.ur.findOneBy({ username });
  }

  public async userById(id: string): Promise<Omit<User, "password"> | null> {
    return UserRepository.ur.findOneBy({ id });
  }
}
