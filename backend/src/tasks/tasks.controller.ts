import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
  Query,
  Request,
} from '@nestjs/common';
import { TaskService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskQueryDto } from '../dto/task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body(ValidationPipe) createTaskDto: CreateTaskDto, @Request() req) {
    return this.taskService.create(createTaskDto, req.user);
  }

  @Get()
  findAll(@Query() queryDto: TaskQueryDto, @Request() req) {
    return this.taskService.findAll(req.user, queryDto);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.taskService.getTaskStats(req.user);
  }

  @Get('analytics/:period')
  getAdvancedAnalytics(@Param('period') period: 'week' | 'month' | 'all', @Request() req) {
    return this.taskService.getAdvancedAnalytics(req.user, period);
  }

  @Post('mark-overdue')
  markOverdueTasks() {
    return this.taskService.markOverdueTasks();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.taskService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
    return this.taskService.update(id, updateTaskDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.taskService.remove(id, req.user);
  }
}
