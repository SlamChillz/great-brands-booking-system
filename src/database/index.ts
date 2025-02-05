import { AppDataSource } from './data-source';
import {logger} from '../utils/logger';

export class DB {
  private static instance: DB | undefined;
  private dataSource = AppDataSource;

  public static getInstance(): DB {
    if (!DB.instance) {
      DB.instance = new DB();
    }
    return DB.instance;
  }

  public async initialize() {
    try {
      await this.dataSource.initialize()
      logger.info('Database initialized...');
    } catch (dbError) {
      logger.error('Database initialization error:', dbError);
      process.exit(1);
    }
  }

  public get client(): typeof AppDataSource {
    return this.dataSource;
  }
}

export default DB.getInstance()
