import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { default as KcAdminClient } from '@keycloak/keycloak-admin-client';

export interface KeycloakUser {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  roles: string[];
}

@Injectable()
export class KeycloakService implements OnModuleInit {
  private readonly logger = new Logger(KeycloakService.name);
  private kcAdminClient: KcAdminClient;
  private readonly baseUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private isKeycloakAvailable = false;
  private initializationPromise: Promise<void>;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get('KEYCLOAK_URL', 'http://localhost:8080');
    this.realm = this.configService.get('KEYCLOAK_REALM', 'master');
    this.clientId = this.configService.get('KEYCLOAK_CLIENT_ID', 'task-management-app');
    this.clientSecret = this.configService.get('KEYCLOAK_CLIENT_SECRET', '');
  }

  async onModuleInit() {
    // Start initialization but don't block module loading
    this.initializationPromise = this.initializeKeycloak();
    
    // Wait a bit for initialization, but don't fail if it takes too long
    try {
      await Promise.race([
        this.initializationPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Keycloak initialization timeout')), 5000)
        )
      ]);
    } catch (error) {
      this.logger.warn('Keycloak initialization delayed, continuing without blocking startup');
    }
  }

  private async initializeKeycloak() {
    try {
      // Check if Keycloak URL is configured
      if (!this.baseUrl) {
        this.logger.warn('KEYCLOAK_URL not configured, skipping Keycloak initialization');
        return;
      }

      this.kcAdminClient = new KcAdminClient({
        baseUrl: this.baseUrl,
        realmName: this.realm,
      });

      await this.authenticate();
      this.isKeycloakAvailable = true;
      this.logger.log('Keycloak service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Keycloak service, continuing without Keycloak features', error);
      this.isKeycloakAvailable = false;
    }
  }

  private async authenticate() {
    try {
      const username = this.configService.get<string>('KEYCLOAK_ADMIN_USERNAME', 'admin');
      const password = this.configService.get<string>('KEYCLOAK_ADMIN_PASSWORD', 'admin');

      if (!username || !password) {
        throw new Error('Keycloak admin credentials not configured');
      }

      await this.kcAdminClient.auth({
        username,
        password,
        grantType: 'password',
        clientId: 'admin-cli',
      });
      this.logger.log('Successfully authenticated with Keycloak');
    } catch (error) {
      this.logger.error('Failed to authenticate with Keycloak', error);
      throw error;
    }
  }

  private async ensureAuthenticated(): Promise<boolean> {
    if (!this.isKeycloakAvailable) {
      this.logger.warn('Keycloak is not available, skipping operation');
      return false;
    }

    try {
      if (this.initializationPromise) {
        await this.initializationPromise;
      }
      await this.authenticate();
      return true;
    } catch (error) {
      this.logger.error('Failed to ensure Keycloak authentication', error);
      this.isKeycloakAvailable = false;
      return false;
    }
  }

  async validateToken(token: string): Promise<any> {
    if (!await this.ensureAuthenticated()) {
      return null;
    }

    try {
      // Verificar el token con Keycloak
      const userInfo = await this.kcAdminClient.users.find({
        // Aquí necesitarías decodificar el token para obtener el subject
      });
      return userInfo;
    } catch (error) {
      this.logger.error('Error validando token:', error);
      return null;
    }
  }

  async getUserById(userId: string): Promise<KeycloakUser | null> {
    if (!await this.ensureAuthenticated()) {
      return null;
    }

    try {
      const user = await this.kcAdminClient.users.findOne({ id: userId });
      if (!user) return null;

      // Obtener roles del usuario
      const userRoles = await this.kcAdminClient.users.listRealmRoleMappings({
        id: userId,
      });

      return {
        id: user.id!,
        username: user.username!,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        enabled: user.enabled || false,
        roles: userRoles.map(role => role.name!).filter(Boolean),
      };
    } catch (error) {
      this.logger.error('Error obteniendo usuario:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<KeycloakUser | null> {
    if (!await this.ensureAuthenticated()) {
      return null;
    }

    try {
      const users = await this.kcAdminClient.users.find({ email, exact: true });
      if (!users || users.length === 0) return null;

      const user = users[0];
      
      // Obtener roles del usuario
      const userRoles = await this.kcAdminClient.users.listRealmRoleMappings({
        id: user.id!,
      });

      return {
        id: user.id!,
        username: user.username!,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        enabled: user.enabled || false,
        roles: userRoles.map(role => role.name!).filter(Boolean),
      };
    } catch (error) {
      this.logger.error('Error obteniendo usuario por email:', error);
      return null;
    }
  }

  async createUser(userData: {
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    password: string;
    role?: string;
  }): Promise<KeycloakUser | null> {
    if (!await this.ensureAuthenticated()) {
      return null;
    }

    try {
      const user = await this.kcAdminClient.users.create({
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enabled: true,
        emailVerified: false,
        credentials: [{
          type: 'password',
          value: userData.password,
          temporary: false,
        }],
      });

      // Asignar rol si se especifica
      if (userData.role) {
        const role = await this.kcAdminClient.roles.findOneByName({ 
          name: userData.role 
        });
        
        if (role && role.id) {
          await this.kcAdminClient.users.addRealmRoleMappings({
            id: user.id,
            roles: [{ id: role.id, name: role.name! }],
          });
        }
      }

      return this.getUserById(user.id);
    } catch (error) {
      this.logger.error('Error creando usuario:', error);
      return null;
    }
  }

  async updateUserRole(userId: string, newRole: string): Promise<boolean> {
    if (!await this.ensureAuthenticated()) {
      return false;
    }

    try {
      // Obtener roles actuales
      const currentRoles = await this.kcAdminClient.users.listRealmRoleMappings({
        id: userId,
      });

      // Remover roles actuales (excepto default-roles)
      const rolesToRemove = currentRoles.filter(role => 
        role.name &&
        !role.name.startsWith('default-roles') && 
        !role.name.includes('offline_access')
      );

      if (rolesToRemove.length > 0) {
        await this.kcAdminClient.users.delRealmRoleMappings({
          id: userId,
          roles: rolesToRemove.map(role => ({ id: role.id!, name: role.name! })),
        });
      }

      // Asignar nuevo rol
      const role = await this.kcAdminClient.roles.findOneByName({ 
        name: newRole 
      });

      if (role && role.id) {
        await this.kcAdminClient.users.addRealmRoleMappings({
          id: userId,
          roles: [{ id: role.id, name: role.name! }],
        });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Error actualizando rol de usuario:', error);
      return false;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    if (!await this.ensureAuthenticated()) {
      return false;
    }

    try {
      await this.kcAdminClient.users.del({ id: userId });
      return true;
    } catch (error) {
      this.logger.error('Error eliminando usuario:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<KeycloakUser[]> {
    if (!await this.ensureAuthenticated()) {
      return [];
    }

    try {
      const users = await this.kcAdminClient.users.find({});
      const keycloakUsers: KeycloakUser[] = [];

      for (const user of users) {
        if (!user.id || !user.username) continue;
        
        const userRoles = await this.kcAdminClient.users.listRealmRoleMappings({
          id: user.id,
        });

        keycloakUsers.push({
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          enabled: user.enabled || false,
          roles: userRoles.map(role => role.name!).filter(Boolean),
        });
      }

      return keycloakUsers;
    } catch (error) {
      this.logger.error('Error obteniendo todos los usuarios:', error);
      return [];
    }
  }

  getLoginUrl(): string {
    return `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/auth?client_id=${this.clientId}&response_type=code&redirect_uri=http://localhost:3000/auth/callback`;
  }

  getLogoutUrl(): string {
    return `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/logout?redirect_uri=http://localhost:3000`;
  }

  isAvailable(): boolean {
    return this.isKeycloakAvailable;
  }

  async getHealthStatus(): Promise<{ available: boolean; error?: string }> {
    try {
      if (this.initializationPromise) {
        await this.initializationPromise;
      }
      return { available: this.isKeycloakAvailable };
    } catch (error) {
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
