import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
  Get,
  Request,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { KeycloakService } from './keycloak.service';
import { CreateUserDto, LoginDto } from '../dto/user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { KeycloakAuthGuard } from './keycloak-auth.guard';
import { RequireAdmin } from './decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('auth-keycloak')
export class AuthKeycloakController {
  constructor(
    private authService: AuthService,
    private keycloakService: KeycloakService,
  ) {}

  // Traditional JWT-based registration
  @Post('register')
  async register(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  // Traditional JWT-based login
  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Register user in both local DB and Keycloak
  @Post('register-keycloak')
  async registerWithKeycloak(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    try {
      // First create user in local database
      const localUser = await this.authService.register(createUserDto);

      // Then create user in Keycloak
      const keycloakUserId = await this.keycloakService.createUser({
        username: createUserDto.email,
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        credentials: [{
          type: 'password',
          value: createUserDto.password,
          temporary: false,
        }],
      });

      // Assign default role
      await this.keycloakService.assignRoleToUser(keycloakUserId, 'user');

      return {
        ...localUser,
        keycloakId: keycloakUserId,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get profile using JWT authentication
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  // Get profile using Keycloak authentication
  @UseGuards(KeycloakAuthGuard)
  @Get('profile-keycloak')
  getKeycloakProfile(@Request() req) {
    return req.user;
  }

  // Admin endpoint - requires admin role in Keycloak
  @UseGuards(KeycloakAuthGuard)
  @RequireAdmin()
  @Get('admin')
  getAdminData(@Request() req) {
    return {
      message: 'This is admin-only data',
      user: req.user,
    };
  }

  // Get all users (admin only)
  @UseGuards(KeycloakAuthGuard)
  @RequireAdmin()
  @Get('users')
  async getUsers(@Query('email') email?: string) {
    if (email) {
      const user = await this.keycloakService.getUserByEmail(email);
      return user ? [user] : [];
    }
    // In a real application, you might want to implement pagination
    return { message: 'Use email query parameter to search for specific users' };
  }
}
