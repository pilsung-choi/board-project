import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { Role, User } from 'src/user/entity/user.entity';
import { Director } from 'src/director/entity/director.entity';
import { Movie } from './entity/movie.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { AuthService } from 'src/auth/auth.service';

describe('MovieController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let users: User[];
  let directors: Director[];
  let movies: Movie[];
  let genres: Genre[];

  let token: string;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        //nestjs에서 자동 타입변환을 활성화
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    dataSource = app.get<DataSource>(DataSource);

    const movieUserLikeRepo = dataSource.getRepository(MovieUserLike);
    const movieRepo = dataSource.getRepository(Movie);
    const movieDetailRepo = dataSource.getRepository(MovieDetail);
    const userRepo = dataSource.getRepository(User);
    const directorRepo = dataSource.getRepository(Director);
    const genreRepo = dataSource.getRepository(Genre);

    // await movieUserLikeRepo.delete({});
    // await movieRepo.delete({});
    // await genreRepo.delete({});
    // await directorRepo.delete({});
    // await userRepo.delete({});
    // await movieDetailRepo.delete({});

    await dataSource
      .getRepository(MovieUserLike)
      .createQueryBuilder()
      .delete()
      .execute();

    await dataSource
      .getRepository(Movie)
      .createQueryBuilder()
      .delete()
      .execute();

    await dataSource
      .getRepository(MovieDetail)
      .createQueryBuilder()
      .delete()
      .execute();

    await dataSource
      .getRepository(Genre)
      .createQueryBuilder()
      .delete()
      .execute();

    await dataSource
      .getRepository(Director)
      .createQueryBuilder()
      .delete()
      .execute();

    await dataSource
      .getRepository(User)
      .createQueryBuilder()
      .delete()
      .execute();

    users = [1, 2].map((x) =>
      userRepo.create({
        id: x,
        email: `${x}@test.com`,
        password: `123123`,
      }),
    );

    await userRepo.save(users);

    directors = [1, 2].map((x) =>
      directorRepo.create({
        id: x,
        dob: new Date('1995-10-27'),
        nationality: 'South Korea',
        name: `Director Name ${x}`,
      }),
    );

    await directorRepo.save(directors);

    genres = [1, 2].map((x) =>
      genreRepo.create({
        id: x,
        name: `Genre ${x}`,
      }),
    );

    await genreRepo.save(genres);

    movies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((x) =>
      movieRepo.create({
        id: x,
        title: `Movie ${x}`,
        creator: users[0],
        genres: genres,
        likeCount: 0,
        dislikeCount: 0,
        detail: movieDetailRepo.create({
          detail: `Movie Detail ${x}`,
        }),
        movieFilePath: 'movies/movie1.mp4',
        director: directors[0],
        createdAt: new Date(`2023-9-${x}`),
      }),
    );

    await movieRepo.save(movies);

    let authService = moduleFixture.get<AuthService>(AuthService);
    token = await authService.issueToken(
      { id: users[0].id, role: Role.admin },
      false,
    );
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await dataSource.destroy();
    await app.close();
  });

  describe('[GET] /movie', () => {
    it('should get all movies', async () => {
      const { body, statusCode, error } = await request(
        app.getHttpServer(),
      ).get('/movie');

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('nextCursor');
      expect(body).toHaveProperty('count');

      expect(body.data).toHaveLength(5);
    });
  });

  describe('[GET /movie/recent]', () => {
    it('should get recent movies', async () => {
      const { body, statusCode } = await request(app.getHttpServer())
        .get('/movie/recent')
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(200);
      expect(body).toHaveLength(10);
    });
  });

  describe('[GET /movie/{id}]', () => {
    it('should get movie by id', async () => {
      const movieId = movies[0].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .get(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(200);
      expect(body.id).toBe(movieId);
    });

    it('should throw 404 error if movie does not exist', async () => {
      const movieId = 999999;

      const { body, statusCode } = await request(app.getHttpServer())
        .get(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(404);
    });
  });

  // describe('[POST /movie]', () => {
  //   it('should create movie', async () => {
  //     const {
  //       body: { fileName },
  //     } = await request(app.getHttpServer())
  //       .post(`/common/video`)
  //       .set('authorization', `Bearer ${token}`)
  //       .attach('video', Buffer.from('test'), 'movie.mp4')
  //       .expect(201);

  //     console.log('filename', fileName);
  //     const dto = {
  //       title: 'Test Movie',
  //       detail: 'Test Movie Detail',
  //       directorId: directors[0].id,
  //       genreIds: genres.map((x) => x.id),
  //       movieFileName: fileName,
  //     };

  //     const { body, statusCode } = await request(app.getHttpServer())
  //       .post(`/movie`)
  //       .set('authorization', `Bearer ${token}`)
  //       .send(dto);

  //     expect(statusCode).toBe(201);

  //     console.log(body);
  //     expect(body).toBeDefined();
  //     expect(body.title).toBe(dto.title);
  //     expect(body.detail.detail).toBe(dto.detail);
  //     expect(body.director.id).toBe(dto.directorId);
  //     expect(body.genres.map((x) => x.id)).toEqual(dto.genreIds);
  //     expect(body.movieFilePath).toContain(fileName);
  //   });
  // });

  describe('[PATCH /movie/{id}]', () => {
    it('should update movie if exists', async () => {
      const dto = {
        title: 'Updated Test Movie',
        detail: 'Updated Test Movie Detail',
        directorId: directors[0].id,
        genreIds: [genres[0].id],
      };

      const movieId = movies[0].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .patch(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`)
        .send(dto);

      expect(statusCode).toBe(200);

      expect(body).toBeDefined();
      expect(body.title).toBe(dto.title);
      expect(body.detail.detail).toBe(dto.detail);
      expect(body.director.id).toBe(dto.directorId);
      expect(body.genres.map((x) => x.id)).toEqual(dto.genreIds);
    });
  });

  describe('[DELETE /movie/{id}]', () => {
    it('should delete existing movie', async () => {
      const movieId = movies[0].id;

      const { body, statusCode } = await request(app.getHttpServer())
        .patch(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(200);
    });

    it('should throw 404 error if movie does not exist', async () => {
      const movieId = 99999;

      const { statusCode } = await request(app.getHttpServer())
        .patch(`/movie/${movieId}`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(404);
    });
  });

  describe('[POST /movie/{id}/like]', () => {
    it('should like a movie', async () => {
      const movieId = movies[1].id;

      const { statusCode, body } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/like`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);

      expect(body).toBeDefined();
      expect(body.isLike).toBe(true);
    });

    it('should cancel like a movie', async () => {
      const movieId = movies[1].id;

      const { statusCode, body } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/like`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);

      expect(body).toBeDefined();
      expect(body.isLike).toBeNull();
    });
  });

  describe('[POST /movie/{id}/dislike]', () => {
    it('should dislike a movie', async () => {
      const movieId = movies[1].id;

      const { statusCode, body } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/dislike`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);

      expect(body).toBeDefined();
      expect(body.isLike).toBe(false);
    });

    it('should cancel dislike a movie', async () => {
      const movieId = movies[1].id;

      const { statusCode, body } = await request(app.getHttpServer())
        .post(`/movie/${movieId}/dislike`)
        .set('authorization', `Bearer ${token}`);

      expect(statusCode).toBe(201);

      expect(body).toBeDefined();
      expect(body.isLike).toBeNull();
    });
  });
});
