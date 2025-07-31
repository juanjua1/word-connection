import Keycloak from 'keycloak-js';

interface KeycloakTokenParsed {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  preferred_username: string;
  realm_access?: {
    roles: string[];
  };
}

interface KeycloakUserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  preferredUsername: string;
}

class KeycloakService {
  private static instance: KeycloakService;
  private keycloak: Keycloak | null = null;

  private constructor() {}

  public static getInstance(): KeycloakService {
    if (!KeycloakService.instance) {
      KeycloakService.instance = new KeycloakService();
    }
    return KeycloakService.instance;
  }

  public async init(): Promise<boolean> {
    try {
      this.keycloak = new Keycloak({
        url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
        realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'task-management',
        clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'task-management-frontend',
      });

      const authenticated = await this.keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        checkLoginIframe: false,
        pkceMethod: 'S256',
      });

      // Set up token refresh
      if (authenticated && this.keycloak.token) {
        this.setupTokenRefresh();
      }

      return authenticated;
    } catch (error) {
      console.error('Failed to initialize Keycloak:', error);
      return false;
    }
  }

  public login(): Promise<void> {
    if (!this.keycloak) {
      throw new Error('Keycloak not initialized');
    }
    return this.keycloak.login();
  }

  public logout(): Promise<void> {
    if (!this.keycloak) {
      throw new Error('Keycloak not initialized');
    }
    return this.keycloak.logout();
  }

  public register(): Promise<void> {
    if (!this.keycloak) {
      throw new Error('Keycloak not initialized');
    }
    return this.keycloak.register();
  }

  public getToken(): string | undefined {
    return this.keycloak?.token;
  }

  public getRefreshToken(): string | undefined {
    return this.keycloak?.refreshToken;
  }

  public isAuthenticated(): boolean {
    return this.keycloak?.authenticated || false;
  }

  public getUserInfo(): KeycloakUserInfo | null {
    if (!this.keycloak?.tokenParsed) {
      return null;
    }

    const tokenParsed = this.keycloak.tokenParsed as KeycloakTokenParsed;
    return {
      id: tokenParsed.sub,
      email: tokenParsed.email,
      firstName: tokenParsed.given_name,
      lastName: tokenParsed.family_name,
      roles: tokenParsed.realm_access?.roles || [],
      preferredUsername: tokenParsed.preferred_username,
    };
  }

  public hasRole(role: string): boolean {
    if (!this.keycloak?.tokenParsed) {
      return false;
    }
    
    const tokenParsed = this.keycloak.tokenParsed as KeycloakTokenParsed;
    const roles = tokenParsed.realm_access?.roles || [];
    return roles.includes(role);
  }

  public async updateToken(): Promise<boolean> {
    try {
      if (!this.keycloak) {
        return false;
      }
      
      const refreshed = await this.keycloak.updateToken(30);
      return refreshed;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }

  private setupTokenRefresh(): void {
    if (!this.keycloak) return;

    // Refresh token every 30 seconds
    setInterval(async () => {
      try {
        await this.updateToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }, 30000);
  }

  public getKeycloak(): Keycloak | null {
    return this.keycloak;
  }
}

export const keycloakService = KeycloakService.getInstance();
