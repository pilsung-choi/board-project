import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const QueryRunner = createParamDecorator(
  (data: string, req: ExecutionContext) => {
    const request = req.switchToHttp().getRequest();
    if (!request || !request.queryRunner) {
      throw new InternalServerErrorException(
        'Query Runner 객체를 찾을 수 없습니다.',
      );
    }
    return request.queryRunner;
  },
);
