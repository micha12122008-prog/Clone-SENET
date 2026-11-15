import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  const createMockContext = (): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if endpoint is marked @Public()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = createMockContext();
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should return user in handleRequest if user exists', () => {
    const user = { id: '1', role: 'CLIENT' };
    expect(guard.handleRequest(null, user, null)).toEqual(user);
  });

  it('should throw UnauthorizedException in handleRequest if user is not present', () => {
    expect(() => guard.handleRequest(null, null, null)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException in handleRequest if error occurred', () => {
    expect(() => guard.handleRequest(new Error('Token expired'), null, null)).toThrow(
      UnauthorizedException,
    );
  });
});
