import { IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { TaskPriority } from '../entities/task.entity';

export class CreateTaskForUserDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateUserRoleDto {
  @IsEnum(['common', 'admin'])
  role: 'common' | 'admin';
}
