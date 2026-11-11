import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('Доступ заборонено: відсутня роль користувача');
    }

    const userRoleStr = String(user.role).toUpperCase();
    const hasRole = requiredRoles.some((role) => String(role).toUpperCase() === userRoleStr);

    if (!hasRole) {
      throw new ForbiddenException(
        `Доступ заборонено: для цієї операції потрібна роль ${requiredRoles.join(' або ')}, а ваша роль — ${user.role}`,
      );
    }

    return true;
  }
}
