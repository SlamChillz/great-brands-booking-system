import dotenv from 'dotenv'
import { get } from "env-var";
import { logger } from '../utils/logger';

dotenv.config()

let hash: {
  SALT: number,
}

try {
  hash = {
    SALT: get('HASH_SALT').required().asPortNumber(),
  }
} catch (e: unknown) {
  logger.error(e)
  process.exit(1)
}

export default hash
