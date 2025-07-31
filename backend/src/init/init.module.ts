import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InitController } from './init.controller';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { Task } from '../entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Category, Task])],
  controllers: [InitController],
})
export class InitModule {}
