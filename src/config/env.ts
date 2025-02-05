import dotenv from 'dotenv'
import { get } from "env-var";
import { logger } from '../utils/logger';

dotenv.config()

enum NODE_ENV_TYPE {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  TEST = 'test',
}

let env: {
  REST_PORT: number,
  NODE_ENV: NODE_ENV_TYPE,
}

try {
  env = {
    REST_PORT: get('REST_PORT').required().asPortNumber(),
    NODE_ENV: get('NODE_ENV').required().asString() as NODE_ENV_TYPE,
  }
} catch (e: unknown) {
  logger.error(e)
  process.exit(1)
}

export default env
