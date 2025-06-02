import { ArgumentsHost, Catch, ExceptionFilter, Query } from '@nestjs/common';
import path from 'path';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    const status = 400;

    let message = '데이터베이스 에러 발생';

    if (exception.message.includes('duplicate key')) {
      message = '중복 키 에러';
    }

    res.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      message: message,
    });
  }
}
