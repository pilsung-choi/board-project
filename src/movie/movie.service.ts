import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepo: Repository<Director>,
    @InjectRepository(Genre)
    private readonly gerneRepo: Repository<Genre>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(MovieUserLike)
    private readonly movieUserLikeRepo: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if (cacheData) {
      return cacheData;
    }

    const data = await this.movieRepository.find({
      order: {
        createdAt: 'DESC',
      },
      take: 10,
    });

    await this.cacheManager.set('MOVIE_RECENT', data);
    return data;
  }

  /* istanbul ignore next */
  async getMovies() {
    return this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    return await this.movieUserLikeRepo
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id IN (:...movieIds)', { movieIds })
      .andWhere('user.id = :userId', { userId })
      .getMany();
  }

  async getManyMovies(dto: GetMoviesDto, userId?: number) {
    const { title } = dto;
    const qb = await this.getMovies();

    if (title) {
      qb.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    const { nextCursor } =
      await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    let [data, count] = await qb.getManyAndCount();

    if (userId) {
      const movieIds = data.map((movie) => movie.id);

      const likedMovies =
        movieIds.length < 1 ? [] : await this.getLikedMovies(movieIds, userId);

      const likedMoviesMap = likedMovies.reduce(
        (acc, cur) => ({
          ...acc,
          [cur.movie.id]: cur.isLike,
        }),
        {},
      );

      data = data.map((x) => ({
        ...x,
        likeStatus: x.id in likedMoviesMap ? likedMoviesMap[x.id] : false,
      }));
    }

    return {
      data,
      nextCursor,
      count,
    };

    // if (!title) {
    //   return [
    //     await this.movieRepository.find({
    //       relations: ['director', 'genres'],
    //     }),
    //     await this.movieRepository.count(),
    //   ];
    // }

    // return this.movieRepository.findAndCount({
    //   where: {
    //     title: Like(`%${title}%`),
    //   },
    //   relations: ['director', 'genres'],
    // });
  }

  async getMovieById(id: number) {
    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id,
    //   },
    //   relations: ['detail', 'director', 'genres'],
    // });

    const movie = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.creator', 'creator')
      .where('movie.id = :id', { id })
      .getOne();

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    return movie;
  }

  async createMovie(
    createMovieDto: CreateMovieDto,
    userId: number,
    qr: QueryRunner,
  ) {
    const director = await qr.manager.findOne(Director, {
      where: {
        id: createMovieDto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
    }

    const genres = await qr.manager.find(Genre, {
      where: {
        id: In(createMovieDto.genreIds),
      },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new NotFoundException(
        `존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')} `,
      );
    }

    const movieDetail = await qr.manager
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: createMovieDto.detail,
      })
      .execute();

    const movieDetailId = movieDetail.identifiers[0].id;

    const movieFolder = join('public', 'movie');
    const tempFolder = join('public', 'temp');

    const movie = await qr.manager
      .createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: createMovieDto.title,
        detail: {
          id: movieDetailId,
        },
        director,
        creator: {
          id: userId,
        },
        movieFilePath: join(movieFolder, createMovieDto.movieFileName),
      })
      .execute();

    const movieId = movie.identifiers[0].id;

    await qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map((genre) => genre.id));

    // const movie = await this.movieRepository.save({
    //   title: createMovieDto.title,
    //   genre: createMovieDto.genreIds,
    //   detail: {
    //     detail: createMovieDto.detail,
    //   },
    //   director,
    //   genres,
    // });

    // return await this.movieRepository.findOne({
    //   where: {
    //     id: movieId,
    //   },
    //   relations: ['detail', 'director', 'genres'],
    //});

    await rename(
      join(process.cwd(), tempFolder, createMovieDto.movieFileName),
      join(process.cwd(), movieFolder, createMovieDto.movieFileName),
    );

    return await qr.manager.findOne(Movie, {
      where: {
        id: movieId,
      },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const movie = await qr.manager.findOne(Movie, {
        where: {
          id,
        },
        relations: ['detail', 'genres'],
      });

      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
      }

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      let newDirector;

      if (directorId) {
        const director = await qr.manager.findOne(Director, {
          where: {
            id: directorId,
          },
        });

        if (!director) {
          throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
        }

        newDirector = director;
      }

      let newGenres;

      if (genreIds) {
        const genres = await qr.manager.find(Genre, {
          where: {
            id: In(genreIds),
          },
        });

        if (genres.length !== updateMovieDto.genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map((genre) => genre.id).join(',')} `,
          );
        }

        newGenres = genres;
      }

      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector }),
      };

      // 쿼리빌더 변환
      //await this.movieRepository.update({ id }, movieUpdateFields);
      await qr.manager
        .createQueryBuilder()
        .update(Movie)
        .set(movieUpdateFields)
        .where('id = :id', { id })
        .execute();

      if (detail) {
        // 쿼리빌더 변환
        // await this.movieDetailRepository.update(
        //   {
        //     id: movie.detail.id,
        //   },
        //   { detail },
        // );
        await qr.manager
          .createQueryBuilder()
          .update(MovieDetail)
          .set({ detail })
          .where('id = :id', { id: movie.detail.id })
          .execute();
      }

      // 쿼리빌더 변환
      // const newMovie = await this.movieRepository.findOne({
      //   where: {
      //     id,
      //   },
      //   relations: ['detail', 'director'],
      // });

      // newMovie.genres = newGenres;

      // await this.movieRepository.save(newMovie);

      if (newGenres) {
        await qr.manager
          .createQueryBuilder()
          .relation(Movie, 'genres')
          .of(id)
          .addAndRemove(
            newGenres.map((genre) => genre.id),
            movie.genres.map((genre) => genre.id),
          );
      }

      await qr.commitTransaction();

      return this.movieRepository.findOne({
        where: {
          id,
        },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    //await this.movieRepository.delete(id);
    await this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();

    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieRepository.findOne({
      where: {
        id: movieId,
      },
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('사용자가 존재하지 않습니다.');
    }

    const likeRecord = await this.movieUserLikeRepo
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id = :movieId', { movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        await this.movieUserLikeRepo.delete({
          movie,
          user,
        });
      } else {
        await this.movieUserLikeRepo.update(
          {
            movie,
            user,
          },
          {
            isLike,
          },
        );
      }
    } else {
      await this.movieUserLikeRepo.save({
        movie,
        user,
        isLike,
      });
    }

    const result = await this.movieUserLikeRepo
      .createQueryBuilder('mul')
      .leftJoinAndSelect('mul.movie', 'movie')
      .leftJoinAndSelect('mul.user', 'user')
      .where('movie.id = :movieId', { movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    return {
      isLike: result && result.isLike,
    };
  }
}
