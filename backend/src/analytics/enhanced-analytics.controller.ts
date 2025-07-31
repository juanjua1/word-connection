import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EnhancedAnalyticsService } from './enhanced-analytics.service';

class GetEnhancedAnalyticsQuery {
  timeframe?: 'week' | 'month' | 'quarter' = 'month';
}

@Controller('analytics/enhanced')
@UseGuards(JwtAuthGuard)
export class EnhancedAnalyticsController {
  constructor(
    private enhancedAnalyticsService: EnhancedAnalyticsService
  ) {}

  @Get()
  async getEnhancedAnalytics(
    @Query() query: GetEnhancedAnalyticsQuery,
    @Request() req
  ) {
    const { timeframe = 'month' } = query;
    return this.enhancedAnalyticsService.getEnhancedAnalytics(req.user, timeframe);
  }
}
