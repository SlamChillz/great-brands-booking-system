import dotenv from 'dotenv'
import { get } from "env-var";
import { logger } from '../utils/logger';

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

try {
  db = {
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
