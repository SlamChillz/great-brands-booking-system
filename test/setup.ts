import { DataSource } from 'typeorm';
import { Booking, Event, User, Waitlist } from '../src/database/entity';
import config from '../src/config';

export default async () => {
  return new DataSource({
		type: config.db.TYPE,
		host: config.db.HOST,
		port: config.db.PORT,
		username: config.db.USERNAME,
		password: config.db.PASSWORD,
		database: config.db.DATABASE,
		dropSchema: true,
		synchronize: true,
		logging: false,
		entities: [User, Event, Booking, Waitlist]
	})
};
