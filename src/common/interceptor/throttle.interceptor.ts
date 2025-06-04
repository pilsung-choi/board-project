import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, throwError } from 'rxjs';
import { Throttle } from '../decorator/throttle.decorator';

@Injectable()
export class ThrottleInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    // URL_USERID_MINUTE
    // VALUE -> count

    const userId = req?.user?.sub;

    if (!userId) {
      return next.handle();
    }

    const throttleOptions = this.reflector.get<{
      count: number;
      unit: 'minute';
    }>(Throttle, context.getHandler());

    if (!throttleOptions) {
      return next.handle();
    }

    const date = new Date();
    const minute = date.getMinutes();

    const key = `${req.method}_${req.path}_${userId}_${minute}`;

    const count = await this.cacheManager.get<number>(key);

    if (count && throttleOptions.count <= count) {
      throw new ForbiddenException('요청 가능 횟수를 초과했습니다.');
    }

    return next.handle().pipe(
      tap(async () => {
        const count = (await this.cacheManager.get<number>(key)) ?? 0;

        this.cacheManager.set(key, count + 1, 60000);
      }),
    );
  }
}
