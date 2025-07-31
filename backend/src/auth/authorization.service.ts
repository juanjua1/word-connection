import { Injectable } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

export interface UserPermissions {
  canCreateTasks: boolean;
  canEditOwnTasks: boolean;
  canDeleteOwnTasks: boolean;
  canViewOwnTasks: boolean;
  canAssignTasksToOthers: boolean;
  canViewAllTasks: boolean;
  canEditAllTasks: boolean;
  canDeleteAllTasks: boolean;
  canManageUsers: boolean;
  canViewUserStats: boolean;
  canManageSystem: boolean;
}

@Injectable()
export class AuthorizationService {
  /**
   * Obtiene los permisos basados en el rol del usuario
   */
  getPermissionsByRole(role: UserRole): UserPermissions {
    switch (role) {
      case UserRole.COMMON:
        return {
          canCreateTasks: true,
          canEditOwnTasks: true,
          canDeleteOwnTasks: true,
          canViewOwnTasks: true,
          canAssignTasksToOthers: false,
          canViewAllTasks: false,
          canEditAllTasks: false,
          canDeleteAllTasks: false,
          canManageUsers: false,
          canViewUserStats: false,
          canManageSystem: false,
        };

      case UserRole.PREMIUM:
        return {
          canCreateTasks: true,
          canEditOwnTasks: true,
          canDeleteOwnTasks: true,
          canViewOwnTasks: true,
          canAssignTasksToOthers: false,
          canViewAllTasks: false,
          canEditAllTasks: false,
          canDeleteAllTasks: false,
          canManageUsers: false,
          canViewUserStats: true,          // Premium analytics access
          canManageSystem: false,
        };

      case UserRole.ADMIN:
        return {
          canCreateTasks: true,
          canEditOwnTasks: true,
          canDeleteOwnTasks: true,
          canViewOwnTasks: true,
          canAssignTasksToOthers: true,    // Admin feature
          canViewAllTasks: true,           // Admin feature
          canEditAllTasks: true,           // Admin feature
          canDeleteAllTasks: false,        // Solo super admin puede borrar todo
          canManageUsers: true,            // Admin feature
          canViewUserStats: true,
          canManageSystem: false,
        };

      case UserRole.SUPER_ADMIN:
        return {
          canCreateTasks: true,
          canEditOwnTasks: true,
          canDeleteOwnTasks: true,
          canViewOwnTasks: true,
          canAssignTasksToOthers: true,
          canViewAllTasks: true,
          canEditAllTasks: true,
          canDeleteAllTasks: true,         // Super admin feature
          canManageUsers: true,
          canViewUserStats: true,
          canManageSystem: true,           // Super admin feature
        };

      default:
        // Permisos mínimos por defecto
        return {
          canCreateTasks: false,
          canEditOwnTasks: false,
          canDeleteOwnTasks: false,
          canViewOwnTasks: false,
          canAssignTasksToOthers: false,
          canViewAllTasks: false,
          canEditAllTasks: false,
          canDeleteAllTasks: false,
          canManageUsers: false,
          canViewUserStats: false,
          canManageSystem: false,
        };
    }
  }

  /**
   * Verifica si un usuario tiene un permiso específico
   */
  hasPermission(userRole: UserRole, permission: keyof UserPermissions): boolean {
    const permissions = this.getPermissionsByRole(userRole);
    return permissions[permission];
  }

  /**
   * Verifica si un usuario puede acceder a funcionalidades premium
   */
  isPremiumUser(role: UserRole): boolean {
    return [UserRole.PREMIUM, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role);
  }

  /**
   * Verifica si un usuario tiene rol administrativo
   */
  isAdminUser(role: UserRole): boolean {
    return [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role);
  }

  /**
   * Verifica si un usuario es super administrador
   */
  isSuperAdmin(role: UserRole): boolean {
    return role === UserRole.SUPER_ADMIN;
  }
}
