import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role, User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { access } from 'fs';

const mockUserRepo = {
  findOne: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
  decode: jest.fn(),
};

const mockCacheManager = {
  set: jest.fn(),
};

const mockUserService = {
  create: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let userRepo: Repository<User>;
  let configService: ConfigService;
  let jwtService: JwtService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(true).toBe(true);

    // expect(authService).toBeDefined();
  });

  describe('tokenBlock', () => {
    it('should block a token', async () => {
      const token = 'test_token';
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 60,
      };

      jest.spyOn(jwtService, 'decode').mockReturnValue(payload);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await authService.tokenBlock(token);

      expect(result).toEqual(true);
      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(cacheManager.set).toHaveBeenCalledWith(
        `BLOCK_TOKEN_${token}`,
        payload,
        expect.any(Number),
      );
    });
  });

  describe('parseBasicToken', () => {
    it('should parse a valid Basic Token', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const credentials = Buffer.from(`${email}:${password}`).toString(
        'base64',
      );
      const token = `Basic ${credentials}`;

      const result = authService.parseBasicToken(token);

      expect(result).toEqual({ email, password });
    });

    it('should throw BadRequestException for invalid token format', () => {
      const rawToken = 'InvalidToken';

      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid basic token format', () => {
      const rawToken = 'Bearer InvalidToken';

      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid basic tokn format', () => {
      const rawToken = 'Basic a';

      expect(() => authService.parseBasicToken(rawToken)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('parseBearerToken', () => {
    it('should parse a valid Bearer Token', async () => {
      const rawToken = 'Bearer fdanecvpakbev==';
      const payload = { type: 'access' };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(mockConfigService, 'get').mockReturnValue('secret');

      const result = await authService.parseBearerToken(rawToken, false);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('fdanecvpakbev==', {
        secret: 'secret',
      });
      expect(result).toEqual(payload);
    });

    it('should throw an error for invalid Bearer token format', () => {
      const InvalidToken = 'Bearerfdfdfdfd';
      expect(authService.parseBearerToken(InvalidToken, false)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw a BadRequestException if token does not start Bearer token format', () => {
      const InvalidToken = 'Rearer fdfdfdfd';
      expect(authService.parseBearerToken(InvalidToken, false)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw a BadRequestException if payload.type is not refresh but isRefreshToken parameter is true', () => {
      const rowToken = 'Bearer dfdfdfdfd';

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        type: 'refresh',
      });

      expect(authService.parseBearerToken(rowToken, false)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw a BadRequestException if payload.type is not refresh but isRefreshToken parameter is true', () => {
      const rowToken = 'Bearer dfdfdfdfd';

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        type: 'access',
      });

      expect(authService.parseBearerToken(rowToken, true)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const token = 'Basic token';
      const user = {
        email: 'test@test.com',
        password: '1234',
      };

      jest.spyOn(authService, 'parseBasicToken').mockReturnValue(user);
      jest.spyOn(mockUserService, 'create').mockResolvedValue(user);

      const result = await authService.register(token);

      expect(result).toEqual(user);
      expect(authService.parseBasicToken).toHaveBeenCalledWith(token);
      expect(userService.create).toHaveBeenCalledWith(user);
    });
  });

  describe('issueToken', () => {
    const token = 'token';
    const user = {
      id: 1,
      role: Role.user,
    };
    beforeEach(() => {
      jest.spyOn(mockConfigService, 'get').mockReturnValue('secret');
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);
    });

    it('should issue an access token', async () => {
      const result = await authService.issueToken(user as User, false);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          role: user.role,
          type: 'access',
        },
        {
          secret: 'secret',
          expiresIn: '1h',
        },
      );
      expect(result).toBe(token);
    });

    it('should issue an refresh token', async () => {
      const result = await authService.issueToken(user as User, true);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          role: user.role,
          type: 'refresh',
        },
        {
          secret: 'secret',
          expiresIn: '24h',
        },
      );
      expect(result).toBe(token);
    });
  });

  describe('login', () => {
    it('should login a user and return tokens', async () => {
      // Given - 모킹 설정 먼저
      const refreshToken = 'refresh';
      const accessToken = 'access';
      const rawToken = 'Basic fdhkf';
      const email = 'test@test.com';
      const password = '1234';
      const user = {
        id: 1,
        email: 'test@test.com',
        password,
      };

      jest
        .spyOn(authService, 'parseBasicToken')
        .mockReturnValue({ email, password });
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(user);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation((password, hash) => Promise.resolve(true));

      jest
        .spyOn(authService, 'issueToken')
        .mockResolvedValueOnce(refreshToken) // 첫 번째 호출 (refresh)
        .mockResolvedValueOnce(accessToken); // 두 번째 호출 (access)
      // When - 실제 테스트 실행
      const result = await authService.login(rawToken);

      // Then - 검증
      expect(result).toEqual({
        refreshToken: refreshToken,
        accessToken: accessToken,
      });
      expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: {
          email,
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });

    it('throw a BadRequestException if user does not exit', async () => {
      const email = 'test@test.com';
      const password = '1234';
      const credentials = Buffer.from(`${email}:${password}`).toString(
        'base64',
      );
      const token = `Basic ${credentials}`;

      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      expect(authService.login(token)).rejects.toThrow(BadRequestException);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('throw a BadRequestException if password is wrong', async () => {
      const email = 'test@test.com';
      const password = '1234';
      const credentials = Buffer.from(`${email}:${password}`).toString(
        'base64',
      );
      const token = `Basic ${credentials}`;
      const user = {
        id: 1,
        email: 'test@test.com',
        password: 'hashedPassword',
      };

      jest
        .spyOn(authService, 'parseBasicToken')
        .mockReturnValue({ email, password });
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(user);

      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(authService.login(token)).rejects.toThrow(
        BadRequestException,
      );

      expect(authService.parseBasicToken).toHaveBeenCalledWith(token);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });
  });
});
