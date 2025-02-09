import "reflect-metadata"
import { DataSource } from "typeorm"
import { Event } from './entity'
import { User } from './entity'
import { Waitlist } from './entity';
import { Booking } from './entity';
import config from '../config'

export const AppDataSource = new DataSource({
    type: config.db.TYPE,
    host: config.db.HOST,
    port: config.db.PORT,
    username: config.db.USERNAME,
    password: config.db.PASSWORD,
    database: config.db.DATABASE,
    synchronize: true,
    logging: false,
    entities: [User, Event, Booking, Waitlist],
    migrations: [],
    subscribers: [],
})
