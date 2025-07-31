import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as KeycloakConnect from 'keycloak-connect';
import { KeycloakConfigService } from './keycloak-config.service';

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
  private logger = new Logger(KeycloakAuthGuard.name);
  private keycloak: KeycloakConnect.Keycloak;

  constructor(
    private reflector: Reflector,
    private keycloakConfigService: KeycloakConfigService,
  ) {
    const keycloakConfig = this.keycloakConfigService.getKeycloakConfig();
    this.keycloak = new KeycloakConnect({}, keycloakConfig);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get the roles required for this route
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler()) || [];

    try {
      // Authenticate the token
      const grant = await this.authenticateToken(request);
      if (!grant) {
        throw new UnauthorizedException('No se proporcionó un token válido');
      }

      // Check if user has required roles
      if (requiredRoles.length > 0) {
        const hasRole = requiredRoles.some(role => 
          grant.access_token.hasRealmRole(role)
        );
        if (!hasRole) {
          throw new UnauthorizedException('Permisos insuficientes');
        }
      }

      // Add user info to request
      request.user = {
        id: grant.access_token.content.sub,
        email: grant.access_token.content.email,
        firstName: grant.access_token.content.given_name,
        lastName: grant.access_token.content.family_name,
        roles: grant.access_token.content.realm_access?.roles || [],
        keycloakGrant: grant,
      };

      return true;
    } catch (error) {
      this.logger.error('Authentication failed:', error.message);
      throw new UnauthorizedException('Autenticación fallida');
    }
  }

  private async authenticateToken(request: any): Promise<any> {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    try {
      const grant = await this.keycloak.grantManager.createGrant({
        access_token: token,
      });

      // Validate the token
      if (grant.access_token) {
        await this.keycloak.grantManager.validateAccessToken(grant.access_token);
      }
      
      return grant;
    } catch (error) {
      this.logger.error('Token validation failed:', error.message);
      return null;
    }
  }
}
