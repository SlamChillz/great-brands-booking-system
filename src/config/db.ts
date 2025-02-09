import dotenv from 'dotenv'
import { get } from "env-var";
import { logger } from '../utils/logger';
import env from './env';

dotenv.config()

enum DbTypes {
  POSTGRES = "postgres",
  MYSQL = "mysql",
}

let db: {
  TYPE: DbTypes
  HOST: string
  PORT: number,
  USERNAME: string,
  PASSWORD: string,
  DATABASE: string,
}

const test_db = {
  TYPE: get('DB_TYPE_TEST').required().asString() as DbTypes,
  HOST: get('DB_HOST_TEST').required().asString(),
  PORT: get('DB_PORT_TEST').required().asPortNumber(),
  USERNAME: get('DB_USER_TEST').required().asString(),
  PASSWORD: get('DB_PASSWORD_TEST').required().asString(),
  DATABASE: get('DB_NAME_TEST').required().asString(),
}

try {
  db = env.NODE_ENV === 'test' ? test_db : {
    TYPE: get('DB_TYPE').required().asString() as DbTypes,
    HOST: get('DB_HOST').required().asString(),
    PORT: get('DB_PORT').required().asPortNumber(),
    USERNAME: get('DB_USER').required().asString(),
    PASSWORD: get('DB_PASSWORD').required().asString(),
    DATABASE: get('DB_NAME').required().asString(),
  }
} catch (e: unknown) {
  logger.error(e)
  process.exit(1)
}

export default db
