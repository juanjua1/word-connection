import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeycloakConfigService {
  constructor(private configService: ConfigService) {}

  getKeycloakConfig() {
    return {
      realm: this.configService.get('KEYCLOAK_REALM', 'task-management'),
      'auth-server-url': this.configService.get('KEYCLOAK_URL', 'http://localhost:8080'),
      'ssl-required': 'external',
      resource: this.configService.get('KEYCLOAK_CLIENT_ID', 'task-management-backend'),
      credentials: {
        secret: this.configService.get('KEYCLOAK_CLIENT_SECRET', 'your-keycloak-client-secret'),
      },
      'confidential-port': 0,
      'policy-enforcer': {},
    };
  }

  getKeycloakAdminConfig() {
    return {
      baseUrl: this.configService.get('KEYCLOAK_URL', 'http://localhost:8080'),
      realmName: this.configService.get('KEYCLOAK_REALM', 'task-management'),
    };
  }
}
