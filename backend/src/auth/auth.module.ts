import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthKeycloakController } from './auth-keycloak.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { KeycloakConfigService } from './keycloak-config.service';
import { KeycloakService } from './keycloak.service';
import { KeycloakAuthGuard } from './keycloak-auth.guard';
import { AuthorizationService } from './authorization.service';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AuthKeycloakController],
  providers: [
    AuthService, 
    JwtStrategy, 
    KeycloakConfigService, 
    KeycloakService, 
    KeycloakAuthGuard,
    AuthorizationService,
  ],
  exports: [AuthService, KeycloakService, KeycloakAuthGuard, AuthorizationService],
})
export class AuthModule {}
