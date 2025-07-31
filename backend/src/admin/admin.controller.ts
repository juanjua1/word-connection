import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { AdminService, SearchUsersQuery, CreateTaskForUserDto } from './admin.service';
import { UpdateUserRoleDto } from '../dto/admin.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequireAdmin } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireAdmin()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users/search')
  async searchUsers(
    @Query() query: SearchUsersQuery,
    @Request() req,
  ) {
    return this.adminService.searchUsers(query, req.user);
  }

  @Get('users/:userId')
  async getUserDetails(
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.adminService.getUserDetails(userId, req.user);
  }

  @Post('users/:userId/tasks')
  async createTaskForUser(
    @Param('userId') userId: string,
    @Body(ValidationPipe) createTaskDto: CreateTaskForUserDto,
    @Request() req,
  ) {
    // El DTO del servicio ya espera assignedToUserId, así que lo establecemos
    const taskData = {
      ...createTaskDto,
      assignedToUserId: userId,
    };
    return this.adminService.createTaskForUser(taskData, req.user);
  }

  @Patch('users/:userId/role')
  async updateUserRole(
    @Param('userId') userId: string,
    @Body(ValidationPipe) updateRoleDto: UpdateUserRoleDto,
    @Request() req,
  ) {
    // Convertir el string del DTO al enum UserRole
    const userRole = updateRoleDto.role === 'admin' ? UserRole.ADMIN : UserRole.COMMON;
    return this.adminService.updateUserRole(userId, userRole, req.user);
  }

  @Patch('users/:userId/status')
  async toggleUserStatus(
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.adminService.toggleUserStatus(userId, req.user);
  }

  @Get('categories')
  async getCategories() {
    return this.adminService.getCategories();
  }
}
