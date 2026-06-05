import 'reflect-metadata';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions, databaseConfig } from '../config/database.config';

const database = databaseConfig();

export const AppDataSource = new DataSource(
  buildTypeOrmOptions(database, {
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
    subscribers: [],
  }),
);

export default AppDataSource;
