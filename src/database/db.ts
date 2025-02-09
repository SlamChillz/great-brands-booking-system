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

  public async destroy(): Promise<void> {
    await this.truncate()
    await this.client.destroy();
  }

  public async truncate(): Promise<void> {
    const tables = [
      'waitlist',
      'booking',
      'event',
      'user',
    ];
    for (const table of tables) {
      await this.dataSource.manager.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
    }
  }
}

export default DB.getInstance()
