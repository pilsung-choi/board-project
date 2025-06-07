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
    it('should return a list of movies without user likes', async () => {});
  });
});
