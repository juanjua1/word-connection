import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from '../authorization.service';
import { ROLES_KEY, PERMISSIONS_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authorizationService: AuthorizationService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener roles requeridos del decorador
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Obtener permisos requeridos del decorador
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles ni permisos requeridos, permitir acceso
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Verificar roles si están especificados
    if (requiredRoles) {
      const hasRole = requiredRoles.some(role => user.role === role);
      if (!hasRole) {
        throw new ForbiddenException('No tienes permisos suficientes para acceder a este recurso');
      }
    }

    // Verificar permisos específicos si están especificados
    if (requiredPermissions) {
      const userPermissions = this.authorizationService.getPermissionsByRole(user.role);
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions[permission as keyof typeof userPermissions]
      );
      
      if (!hasAllPermissions) {
        throw new ForbiddenException('No tienes los permisos necesarios para realizar esta acción');
      }
    }

    return true;
  }
}
