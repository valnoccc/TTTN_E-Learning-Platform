import { registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export const databaseConfig = registerAs(
  'database',
  (): DatabaseConfig => ({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    username: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASS ?? '',
    database: process.env.DB_NAME ?? '',
  }),
);

export function buildTypeOrmOptions(
  config: DatabaseConfig,
  overrides: Partial<DataSourceOptions> = {},
): DataSourceOptions {
  return {
    type: 'mysql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    synchronize: false,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
    ...overrides,
  } as DataSourceOptions;
}
