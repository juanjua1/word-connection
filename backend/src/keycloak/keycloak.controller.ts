import { Controller, Get, Post, Body, UseGuards, Request, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { KeycloakService } from './keycloak.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireAdmin, RequireSuperAdmin } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('keycloak')
export class KeycloakController {
  constructor(private keycloakService: KeycloakService) {}

  @Get('login-url')
  getLoginUrl() {
    return {
      loginUrl: this.keycloakService.getLoginUrl(),
    };
  }

  @Get('logout-url')
  getLogoutUrl() {
    return {
      logoutUrl: this.keycloakService.getLogoutUrl(),
    };
  }

  @Post('create-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  async createUser(@Body() userData: {
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    password: string;
    role?: string;
  }) {
    const user = await this.keycloakService.createUser(userData);
    if (user) {
      return { success: true, user };
    }
    return { success: false, message: 'Error al crear usuario' };
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  async getAllUsers() {
    const users = await this.keycloakService.getAllUsers();
    return { users };
  }

  @Get('user/:id')
  @UseGuards(JwtAuthGuard)
  async getUserById(@Query('id') id: string) {
    const user = await this.keycloakService.getUserById(id);
    if (user) {
      return { success: true, user };
    }
    return { success: false, message: 'Usuario no encontrado' };
  }

  @Post('update-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  async updateUserRole(@Body() data: { userId: string; role: string }) {
    const success = await this.keycloakService.updateUserRole(data.userId, data.role);
    if (success) {
      return { success: true, message: 'Rol actualizado exitosamente' };
    }
    return { success: false, message: 'Error al actualizar rol' };
  }

  @Post('delete-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireAdmin()
  async deleteUser(@Body() data: { userId: string }) {
    const success = await this.keycloakService.deleteUser(data.userId);
    if (success) {
      return { success: true, message: 'Usuario eliminado exitosamente' };
    }
    return { success: false, message: 'Error al eliminar usuario' };
  }

  @Get('health')
  async healthCheck() {
    const healthStatus = await this.keycloakService.getHealthStatus();
    
    if (healthStatus.available) {
      try {
        const users = await this.keycloakService.getAllUsers();
        return { 
          status: 'healthy', 
          keycloak: 'connected',
          userCount: users.length 
        };
      } catch (error) {
        return { 
          status: 'degraded', 
          keycloak: 'connected_but_limited',
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    } else {
      return { 
        status: 'degraded', 
        keycloak: 'disconnected',
        error: healthStatus.error || 'Keycloak service not available',
        note: 'Application running with local authentication only'
      };
    }
  }

  @Get('status')
  async getStatus() {
    return {
      available: this.keycloakService.isAvailable(),
      healthStatus: await this.keycloakService.getHealthStatus()
    };
  }
}
