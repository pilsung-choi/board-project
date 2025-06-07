import { Test, TestingModule } from '@nestjs/testing';
import { MovieService } from './movie.service';
import { TestBed } from '@automock/jest';
import { DataSource, Repository } from 'typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { User } from 'src/user/entities/user.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { CommonService } from 'src/common/common.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetMoviesDto } from './dto/get-movies.dto';

describe('MovieService', () => {
  let movieService: MovieService;
  let movieRepo: jest.Mocked<Repository<Movie>>;
  let movieDetailRepo: jest.Mocked<Repository<MovieDetail>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let directorRepo: jest.Mocked<Repository<Director>>;
  let genreRepo: jest.Mocked<Repository<Genre>>;
  let moviveUserLikeRepo: jest.Mocked<Repository<MovieUserLike>>;
  let dataSource: jest.Mocked<DataSource>;
  let commonService: jest.Mocked<CommonService>;
  let cacheManager: Cache;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(MovieService).compile();

    movieService = unit;
    movieRepo = unitRef.get(getRepositoryToken(Movie) as string);
    movieDetailRepo = unitRef.get(getRepositoryToken(MovieDetail) as string);
    userRepo = unitRef.get(getRepositoryToken(User) as string);
    directorRepo = unitRef.get(getRepositoryToken(Director) as string);
    genreRepo = unitRef.get(getRepositoryToken(Genre) as string);
    moviveUserLikeRepo = unitRef.get(
      getRepositoryToken(MovieUserLike) as string,
    );
    dataSource = unitRef.get(DataSource);
    commonService = unitRef.get(CommonService);
    cacheManager = unitRef.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(movieService).toBeDefined();
  });

  describe('findRecent', () => {
    it('should return movie data if MOVIE_RECENT is cached', async () => {
      const cachedMovie = [{ id: 1, title: 'inception' }];

      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedMovie);

      const result = await movieService.findRecent();

      expect(cacheManager.get).toHaveBeenCalledWith('MOVIE_RECENT');
      expect(result).toEqual(cachedMovie);
    });

    it('should fetch recent movies from the repository and cache them if not found in cache', async () => {
      const recentMovies = [{ id: 1, title: 'movie' }];

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(movieRepo, 'find').mockResolvedValue(recentMovies as Movie[]);

      const result = await movieService.findRecent();

      expect(cacheManager.get).toHaveBeenCalledWith('MOVIE_RECENT');
      expect(cacheManager.set).toHaveBeenCalledWith(
        'MOVIE_RECENT',
        recentMovies,
      );
      expect(result).toEqual(recentMovies);
    });
  });

  describe('getLikedMovies', () => {
    let getMoviesMock: jest.SpyInstance;
    let getLikedMoviesMock: jest.SpyInstance;
    let applyCursorPaginationParamsToQbMock: jest.SpyInstance;
    let qb: any;

    beforeEach(() => {
      getMoviesMock = jest.spyOn(movieService, 'getMovies');
      getLikedMoviesMock = jest.spyOn(movieService, 'getLikedMovies');
      applyCursorPaginationParamsToQbMock = jest.spyOn(
        commonService,
        'applyCursorPaginationParamsToQb',
      );
      qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
      };
    });

    it('should return a list of movies without user likes', async () => {
      // userlike 없이 title 없을 때, 처음 불려서 nextCursor 없음
      const movies = [
        {
          id: 1,
          title: 'Movie 1',
        },
      ];
      const dto = { title: 'Movie 1' } as GetMoviesDto;

      getMoviesMock.mockResolvedValue(qb);
      applyCursorPaginationParamsToQbMock.mockResolvedValue({
        nextCursor: null,
      } as any);
      qb.getManyAndCount.mockResolvedValue([movies, 1]);

      const result = await movieService.getManyMovies(dto);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('movie.title LIKE :title', {
        title: `%${dto.title}%`,
      });
      expect(
        commonService.applyCursorPaginationParamsToQb,
      ).toHaveBeenCalledWith(qb, dto);
      // expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        data: movies,
        nextCursor: null,
        count: 1,
      });
    });

    it('should return a list of movies with user likes', async () => {
      const movies = [
        { id: 1, title: 'Movie 1' },
        { id: 3, title: 'Movie 3' },
      ];
      const likesMovies = [
        { movie: { id: 1 }, isLike: true },
        { movie: { id: 3 }, isLike: false },
      ];

      const dto = { title: 'Movie' } as GetMoviesDto;

      getMoviesMock.mockResolvedValue(qb);
      applyCursorPaginationParamsToQbMock.mockResolvedValue({
        nextCursor: null,
      });
      getLikedMoviesMock.mockResolvedValue(likesMovies);
      qb.getManyAndCount.mockResolvedValue([movies, 2]);

      const userId = 1;

      const result = await movieService.getManyMovies(dto, userId);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('movie.title LIKE :title', {
        title: `%${dto.title}%`,
      });
      expect(applyCursorPaginationParamsToQbMock).toHaveBeenCalledWith(qb, dto);
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(getLikedMoviesMock).toHaveBeenCalledWith(
        movies.map((movie) => movie.id),
        userId,
      );
      expect(result).toEqual({
        data: [
          {
            id: 1,
            title: 'Movie 1',
            likeStatus: true,
          },
          {
            id: 3,
            title: 'Movie 3',
            likeStatus: false,
          },
        ],
        nextCursor: null,
        count: 2,
      });
    });

    it('should return movies without title filter', async () => {
      const movies = [{ id: 1, title: 'Movie 1' }];
      const dto = {} as GetMoviesDto;

      getMoviesMock.mockResolvedValue(qb);
      applyCursorPaginationParamsToQbMock.mockResolvedValue({
        nextCursor: null,
      });
      qb.getManyAndCount.mockResolvedValue([movies, 1]);

      const result = await movieService.getManyMovies(dto);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(applyCursorPaginationParamsToQbMock).toHaveBeenCalledWith(qb, dto);
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(result).toEqual({
        data: movies,
        nextCursor: null,
        count: 1,
      });
    });
  });
});
