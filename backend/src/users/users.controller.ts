import {
  Controller,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireAdmin } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequireAdmin()
  async findAll(@Request() req: any) {
    const users = await this.usersService.findAll();
    // Filtrar para no incluir el usuario actual en la lista de asignación
    return users.filter(user => user.id !== req.user.id);
  }
}
