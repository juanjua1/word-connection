import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { KeycloakConfigService } from './keycloak-config.service';

export interface KeycloakUser {
  id?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled?: boolean;
  credentials?: Array<{
    type: string;
    value: string;
    temporary?: boolean;
  }>;
}

@Injectable()
export class KeycloakService {
  private logger = new Logger(KeycloakService.name);
  private kcAdminClient: KcAdminClient;
  private isKeycloakAvailable = false;
  private initializationAttempted = false;

  constructor(
    private configService: ConfigService,
    private keycloakConfigService: KeycloakConfigService,
  ) {
    this.initializeKeycloakAdmin();
  }

  private async initializeKeycloakAdmin() {
    if (this.initializationAttempted) return;
    this.initializationAttempted = true;

    try {
      // Check if Keycloak is enabled
      const keycloakEnabled = this.configService.get('KEYCLOAK_ENABLED', 'true') === 'true';
      
      if (!keycloakEnabled) {
        this.logger.warn('🔐 Keycloak is disabled in configuration');
        return;
      }

      const keycloakUrl = this.configService.get('KEYCLOAK_URL', 'http://localhost:8080');
      this.logger.log(`🔐 Attempting to connect to Keycloak at: ${keycloakUrl}`);

      this.kcAdminClient = new KcAdminClient({
        baseUrl: keycloakUrl,
        realmName: 'master', // Use master realm for admin operations
      });

      // Authenticate with admin credentials
      await this.kcAdminClient.auth({
        username: 'admin',
        password: this.configService.get('KEYCLOAK_ADMIN_PASSWORD', 'admin123'),
        grantType: 'password',
        clientId: 'admin-cli',
      });

      // Set the target realm
      this.kcAdminClient.setConfig({
        realmName: this.configService.get('KEYCLOAK_REALM', 'task-management'),
      });

      this.isKeycloakAvailable = true;
      this.logger.log('✅ Keycloak Admin Client initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize Keycloak Admin Client:', error.message);
      this.logger.error('🛠️  Please ensure Keycloak is running at the configured URL');
      this.isKeycloakAvailable = false;
    }
  }

  async createUser(userData: KeycloakUser): Promise<string> {
    if (!this.isKeycloakAvailable) {
      this.logger.warn('Keycloak not available, skipping user creation');
      return 'local-user-id'; // Return a mock ID for local development
    }

    try {
      // Ensure admin client is authenticated
      await this.ensureAuthenticated();

      const user = await this.kcAdminClient.users.create({
        username: userData.email, // Use email as username
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enabled: true,
        credentials: userData.credentials || [],
      });

      this.logger.log(`User created in Keycloak with ID: ${user.id}`);
      return user.id;
    } catch (error) {
      this.logger.error('Failed to create user in Keycloak:', error.message);
      throw error;
    }
  }

  // Add method to check Keycloak availability
  isAvailable(): boolean {
    return this.isKeycloakAvailable;
  }

  // Add method to retry connection
  async retryConnection(): Promise<boolean> {
    this.initializationAttempted = false;
    await this.initializeKeycloakAdmin();
    return this.isKeycloakAvailable;
  }

  async updateUser(userId: string, userData: Partial<KeycloakUser>): Promise<void> {
    try {
      await this.ensureAuthenticated();

      await this.kcAdminClient.users.update({ id: userId }, userData);
      
      this.logger.log(`User ${userId} updated in Keycloak`);
    } catch (error) {
      this.logger.error('Failed to update user in Keycloak:', error.message);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.ensureAuthenticated();

      await this.kcAdminClient.users.del({ id: userId });
      
      this.logger.log(`User ${userId} deleted from Keycloak`);
    } catch (error) {
      this.logger.error('Failed to delete user from Keycloak:', error.message);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<any> {
    try {
      await this.ensureAuthenticated();

      const users = await this.kcAdminClient.users.find({ email, exact: true });
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      this.logger.error('Failed to get user from Keycloak:', error.message);
      return null;
    }
  }

  async assignRoleToUser(userId: string, roleName: string): Promise<void> {
    try {
      await this.ensureAuthenticated();

      // Get the role
      const role = await this.kcAdminClient.roles.findOneByName({ name: roleName });
      if (!role) {
        throw new Error(`Role ${roleName} not found`);
      }

      // Assign the role to the user
      if (role.id && role.name) {
        await this.kcAdminClient.users.addRealmRoleMappings({
          id: userId,
          roles: [{
            id: role.id,
            name: role.name,
          }],
        });
      } else {
        throw new Error(`Invalid role data for ${roleName}`);
      }

      this.logger.log(`Role ${roleName} assigned to user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to assign role to user:', error.message);
      throw error;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.isKeycloakAvailable) {
      throw new Error('Keycloak is not available');
    }

    try {
      // Check if token is still valid, if not re-authenticate
      await this.kcAdminClient.auth({
        username: 'admin',
        password: this.configService.get('KEYCLOAK_ADMIN_PASSWORD', 'admin123'),
        grantType: 'password',
        clientId: 'admin-cli',
      });
    } catch (error) {
      this.logger.error('Failed to authenticate with Keycloak:', error.message);
      this.isKeycloakAvailable = false; // Mark as unavailable if auth fails
      throw error;
    }
  }
}
