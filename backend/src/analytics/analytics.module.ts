import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { EnhancedAnalyticsController } from './enhanced-analytics.controller';
import { EnhancedAnalyticsService } from './enhanced-analytics.service';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User, Category])],
  controllers: [AnalyticsController, EnhancedAnalyticsController],
  providers: [AnalyticsService, EnhancedAnalyticsService],
  exports: [AnalyticsService, EnhancedAnalyticsService],
})
export class AnalyticsModule {}
