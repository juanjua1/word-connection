import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Task } from '../entities/task.entity';
import { Category } from '../entities/category.entity';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const nodeEnv = configService.get('NODE_ENV');
  
  // Use SQLite for development if PostgreSQL is not available
  if (nodeEnv === 'development') {
    const dbHost = configService.get('DATABASE_HOST');
    const dbType = configService.get('DATABASE_TYPE');
    
    // Use PostgreSQL if DATABASE_HOST is defined and DATABASE_TYPE is not sqlite
    if (dbHost && dbType !== 'sqlite') {
      return {
        type: 'postgres',
        host: dbHost,
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [User, Task, Category],
        synchronize: true,
        logging: true,
      };
    } else {
      return {
        type: 'sqlite',
        database: 'dev.sqlite',
        entities: [User, Task, Category],
        synchronize: true,
        logging: true,
      };
    }
  }
  
  // Production configuration (PostgreSQL)
  return {
    type: 'postgres',
    host: configService.get('DATABASE_HOST'),
    port: configService.get('DATABASE_PORT'),
    username: configService.get('DATABASE_USERNAME'),
    password: configService.get('DATABASE_PASSWORD'),
    database: configService.get('DATABASE_NAME'),
    entities: [User, Task, Category],
    synchronize: false,
    logging: false,
  };
};
