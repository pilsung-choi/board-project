import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { MovieModule } from './movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionalModule, ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { Movie } from './movie/entity/movie.entity';
import { MovieDetail } from './movie/entity/movie-detail.entity';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entity/director.entity';
import { GenreModule } from './genre/genre.module';
import { Genre } from './genre/entity/genre.entity';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { User } from './user/entity/user.entity';
import { envVariableKeys } from './common/const/env.const';
import { env } from 'process';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token.middleware';
import { AuthGuard } from './auth/guard/auth.guard';
import { RBACGuard } from './auth/guard/rbac.guard';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseTimeInterceptor } from './common/interceptor/response-time.interceptor';
import { ForbiddenExceptionFilter } from './common/filter/forbidden.filter';
import { QueryFailedExceptionFilter } from './common/filter/query-failed.filter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MovieUserLike } from './movie/entity/movie-user-like.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { Throttle } from './common/decorator/throttle.decorator';
import { ThrottleInterceptor } from './common/interceptor/throttle.interceptor';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import { ChatModule } from './chat/chat.module';
import * as winston from 'winston';
import { Chat } from './chat/entity/chat.entity';
import { ChatRoom } from './chat/entity/chat-room.entity';
import { WorkModule } from './worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? 'test.env' : '.env',
      validationSchema: Joi.object({
        ENV: Joi.string().valid('test', 'dev', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        DB_URL: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_ACCESS_KEY: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        BUCKET_NAME: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        url: configService.get<string>(envVariableKeys.dbUrl),
        type: configService.get<string>(envVariableKeys.dbType) as 'postgres',
        // host: configService.get<string>(envVariableKeys.dbHost),
        // port: configService.get<number>(envVariableKeys.dbPort),
        // username: configService.get(envVariableKeys.dbUserName),
        // password: configService.get<string>(envVariableKeys.dbPassword),
        // database: configService.get<string>(envVariableKeys.dbDatabase),
        entities: [
          Movie,
          MovieDetail,
          Director,
          Genre,
          User,
          MovieUserLike,
          Chat,
          ChatRoom,
        ],
        synchronize:
          configService.get<string>(envVariableKeys.env) === 'prod'
            ? false
            : true, // 개발할때만 true, 프로덕션은 false
        //logging: ['query'],
        ...(configService.get<string>(envVariableKeys.env) === 'prod' && {
          ssl: {
            rejectUnauthorized: false,
          },
        }),
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'), // 정적 파일을 제공할 경로
      serveRoot: '/public/', // 정적 파일을 제공할 경로
      // exclude: ['/api*'], // API 경로는 제외
    }),
    CacheModule.register({
      ttl: 0,
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    WinstonModule.forRoot({
      level: 'debug',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.timestamp(),
            winston.format.printf(
              (info) =>
                `${info.timestamp} [${info.context}] [${info.level}]: ${info.message}`,
            ),
          ),
        }),
        // new winston.transports.File({
        //   dirname: join(process.cwd(), 'logs'),
        //   filename: 'logs.log',
        // }),
      ],
    }),
    PostsModule,
    MovieModule,
    DirectorModule,
    GenreModule,
    AuthModule,
    UserModule,
    ChatModule,
    // ConditionalModule.registerWhen(
    //   WorkModule,
    //   (env: NodeJS.ProcessEnv) => env['TYPE'] === 'worker',
    // ),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RBACGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor,
    },
    // {
    //   provide: APP_FILTER,
    //   useClass: ForbiddenExceptionFilter,
    // },
    {
      provide: APP_FILTER,
      useClass: QueryFailedExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ThrottleInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 여기에 미들웨어 설정이 필요하다면 추가할 수 있습니다.
    consumer
      .apply(BearerTokenMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        {
          path: 'auth/register',
          method: RequestMethod.POST,
        },
      )
      // 로그인 라우트는 제외합니다.
      .forRoutes('*'); // 모든 라우트에 BearerTokenMiddleware를 적용합니다.
  }
}
