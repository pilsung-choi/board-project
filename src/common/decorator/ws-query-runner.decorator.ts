import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const WsQueryRunner = createParamDecorator(
  (data: string, req: ExecutionContext) => {
    const client = req.switchToWs().getClient();
    if (!client || !client.data || !client.data.queryRunner) {
      throw new InternalServerErrorException(
        'Query Runner 객체를 찾을 수 없습니다.',
      );
    }
    return client.data.queryRunner;
  },
);
