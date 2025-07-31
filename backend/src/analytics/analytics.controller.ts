import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { Transform } from 'class-transformer';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsArray, IsOptional, IsIn } from 'class-validator';

class GetAnalyticsQuery {
  @IsOptional()
  @IsIn(['week', 'month', 'quarter'])
  timeframe?: 'week' | 'month' | 'quarter' = 'week';

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Manejar tanto arrays normales como el formato teamUserIds[] de axios
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  teamUserIds?: string[];
}

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('personal')
  async getPersonalAnalytics(
    @Query(ValidationPipe) query: GetAnalyticsQuery,
    @Request() req,
  ) {
    return this.analyticsService.getPersonalAnalytics(
      req.user,
      query.timeframe
    );
  }

  @Get('admin')
  async getAdminAnalytics(
    @Query() rawQuery: any,
    @Request() req,
  ) {
    // Transformar manualmente los parámetros para manejar arrays
    const query = this.transformQueryParams(rawQuery);
    
    return this.analyticsService.getAdminAnalytics(
      req.user,
      query.targetUserId,
      query.teamUserIds,
      query.timeframe || 'week'
    );
  }

  private transformQueryParams(rawQuery: any): GetAnalyticsQuery {
    const query: GetAnalyticsQuery = {
      timeframe: rawQuery.timeframe || 'week',
      targetUserId: rawQuery.targetUserId,
    };

    // Manejar teamUserIds que puede venir como teamUserIds[] desde axios
    if (rawQuery.teamUserIds) {
      query.teamUserIds = Array.isArray(rawQuery.teamUserIds) 
        ? rawQuery.teamUserIds 
        : [rawQuery.teamUserIds];
    } else if (rawQuery['teamUserIds[]']) {
      // Manejar el caso específico de axios que envía teamUserIds[]
      query.teamUserIds = Array.isArray(rawQuery['teamUserIds[]']) 
        ? rawQuery['teamUserIds[]'] 
        : [rawQuery['teamUserIds[]']];
    }

    // Validar timeframe
    if (query.timeframe && !['week', 'month', 'quarter'].includes(query.timeframe)) {
      query.timeframe = 'week';
    }

    // Filtrar teamUserIds vacíos
    if (query.teamUserIds) {
      query.teamUserIds = query.teamUserIds.filter(id => id && id.trim().length > 0);
      if (query.teamUserIds.length === 0) {
        query.teamUserIds = undefined;
      }
    }

    return query;
  }
}
