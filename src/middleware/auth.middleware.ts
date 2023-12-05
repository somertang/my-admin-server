import {
  IMiddleware,
  Inject,
  Middleware,
  MidwayWebRouterService,
  RouterInfo,
} from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { R } from '@/common/base.error';
import { RedisService } from '@midwayjs/redis';

@Middleware()
export class AuthMiddleware implements IMiddleware<Context, NextFunction> {
  @Inject()
  redisService: RedisService;

  @Inject()
  webRouterService: MidwayWebRouterService;

  @Inject()
  notLoginRouters: RouterInfo[];

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const routeInfo = await this.webRouterService.getMatchedRouterInfo(
        ctx.path,
        ctx.method
      );

      if (!routeInfo) {
        await next();
        return;
      }

      if (
        this.notLoginRouters.some(
          e =>
            e.requestMethod === routeInfo.requestMethod &&
            e.url === routeInfo.url
        )
      ) {
        await next();
        return;
      }

      const token = ctx.header.authorization?.replace('Bearer ', '');

      if (!token) {
        throw R.unauthorizedError('未授权');
      }

      const userId = await this.redisService.get(`token${token}`);

      if (!userId) {
        throw R.unauthorizedError('未授权');
      }

      ctx.userInfo = { userId, refreshToken: '' };
      ctx.token = token;
      return next();
    };
  }

  static getName(): string {
    return 'auth';
  }
}
