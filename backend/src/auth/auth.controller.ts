import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from '../dto/user.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthorizationService } from './authorization.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private authorizationService: AuthorizationService,
  ) {}

  @Post('register')
  async register(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register-admin')
  async registerAdmin(@Body(ValidationPipe) createAdminUserDto: CreateAdminUserDto) {
    return this.authService.registerAdmin(createAdminUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('permissions')
  getPermissions(@Request() req) {
    return {
      user: req.user,
      permissions: this.authorizationService.getPermissionsByRole(req.user.role),
      isPremium: this.authorizationService.isPremiumUser(req.user.role),
      isAdmin: this.authorizationService.isAdminUser(req.user.role),
      isSuperAdmin: this.authorizationService.isSuperAdmin(req.user.role),
    };
  }
}
