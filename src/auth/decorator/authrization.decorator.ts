import {
  createParamDecorator,
  ExecutionContext,
  RequestTimeoutException,
} from '@nestjs/common';

export const Authrization = createParamDecorator(
  (data: string, req: ExecutionContext) => {
    const request = req.switchToHttp().getRequest();

    return request.headers['authorization'];
  },
);
