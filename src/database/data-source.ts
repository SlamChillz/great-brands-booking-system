import "reflect-metadata"
import { DataSource } from "typeorm"
import { Event } from "./entity/event"
import { User } from "./entity/user"
import { WaitList } from './entity/waitList';
import { Booking } from './entity/booking';
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
    entities: [User, Event, Booking, WaitList],
    migrations: [],
    subscribers: [],
})
