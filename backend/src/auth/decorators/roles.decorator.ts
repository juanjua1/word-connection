import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../entities/user.entity';

// Decorador para requerir roles específicos
export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Decorador para requerir nivel premium o superior
export const RequirePremium = () => RequireRoles(UserRole.PREMIUM, UserRole.ADMIN, UserRole.SUPER_ADMIN);

// Decorador para requerir nivel admin o superior
export const RequireAdmin = () => RequireRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN);

// Decorador para requerir super admin
export const RequireSuperAdmin = () => RequireRoles(UserRole.SUPER_ADMIN);

// Decorador para permisos específicos
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
