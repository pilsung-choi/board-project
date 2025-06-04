import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { DefaultLogger } from './logger/default.logger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class TasksService {
  // private readonly logger = new Logger(TasksService.name); //[TaskesService]
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,
    private readonly scheduleRegistry: SchedulerRegistry,
    //private readonly logger: DefaultLogger,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  // @Cron('*/5 * * * * *')
  // everuSecond() {
  //   //this.logger.fatal('FATAL 레벨 로그', null, TasksService.name);
  //   this.logger.error('ERROR 레벨 로그', null, TasksService.name);
  //   this.logger.warn('WARN 레벨 로그', TasksService.name);
  //   this.logger.warn('LOG 레벨 로그', TasksService.name);
  //   this.logger.debug('DEBUG 레벨 로그', TasksService.name);
  //   this.logger.verbose('VERBOSE 레벨 로그', TasksService.name);
  // }

  //@Cron('* * 0 * * *')
  async eraseOrpahanFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTargets = files.filter((file) => {
      const fileName = parse(file).name;
      const split = fileName.split('_');

      if (split.length !== 2) {
        return false;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));
        const aDayInMilSec = 24 * 60 * 60 * 1000;

        const now = +new Date();

        return now - date > aDayInMilSec;
      } catch (e) {
        return true;
      }
    });
    //console.log(`delete files: ${deleteFilesTargets}`);

    await Promise.all(
      deleteFilesTargets.map((file) => {
        unlink(join(process.cwd(), 'public', 'temp', file));
      }),
    );
  }

  // @Cron('0 * * * * *')
  async calculeteMovieLikeCount() {
    const setLikeCount = await this.movieRepo.query(`
        update movie m
        set "likeCount" = (
	        select count(*) from movie_user_like mul
	        where m.id = mul."movieId" AND mul."isLike" = true
        )
`);

    const setDisLikeCount = await this.movieRepo.query(`
        update movie m
        set "dislikeCount" = (
	        select count(*) from movie_user_like mul
	        where m.id = mul."movieId" AND mul."isLike" = false
        )
`);

    await Promise.all([setLikeCount, setDisLikeCount]);
  }

  //   @Cron('* * * * * *', {
  //     name: 'printer',
  //   })
  //   printer() {
  //     console.log('print every second');
  //   }

  //   //@Cron(' */5 * * * * *')
  //   stopper() {
  //     console.log('stoper run');

  //     const job = this.scheduleRegistry.getCronJob('printer');

  //     console.log('# last Date');
  //     console.log(job.lastDate());
  //     console.log('# next Date');
  //     console.log(job.nextDate());
  //     console.log('#Next Dates');
  //     console.log(job.nextDates(5));

  //     if ((job as any).running) {
  //       job.stop();
  //     } else {
  //       job.start();
  //     }
  //   }
}
