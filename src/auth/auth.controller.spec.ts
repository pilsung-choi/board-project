import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { combineLatestWith } from 'rxjs';
import { Role, User } from 'src/user/entity/user.entity';

const mockAuthService = {
  tokenBlock: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
  issueToken: jest.fn(),
};

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();
    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(true).toBe(true);

    expect(authController).toBeDefined();
  });

  describe('registerUser', () => {
    it('should register a user', async () => {
      const token = 'Basic fjdkmfjkdjfkdjfk';
      const result = { id: 1, email: 'test@test.com' };

      jest.spyOn(authService, 'register').mockResolvedValue(result as User);

      expect(authController.registerUser(token)).resolves.toEqual(result);
      expect(authService.register).toHaveBeenCalledWith(token);
    });
  });

  describe('loginUser', () => {
    it('should login a user', async () => {
      const token = 'Basic fjdkmfjkdjfkdjfk';
      const result = {
        refreshToken: 'mocked.refresh.token',
        accessToken: 'mocked.access.token',
      };

      jest.spyOn(authService, 'login').mockResolvedValue(result);

      expect(authController.loginUser(token)).resolves.toEqual(result);
      expect(authService.login).toHaveBeenCalledWith(token);
    });
  });

  describe('blockToken', () => {
    it('should block a token', async () => {
      const token = 'some.jwt.token';

      jest.spyOn(authService, 'tokenBlock').mockResolvedValue(true);

      expect(authController.blockToken(token)).resolves.toBe(true);
      expect(authService.tokenBlock).toHaveBeenCalledWith(token);
    });
  });

  describe('rotateAccessToken', () => {
    it('should rotate access a token', async () => {
      const accessToken = 'mocked.access.token';

      jest.spyOn(authService, 'issueToken').mockResolvedValue(accessToken);

      const result = await authController.rotateAccessToken({ user: 'a' });

      expect(authService.issueToken).toHaveBeenCalledWith('a', false);
      expect(result).toEqual({ accessToken });
    });
  });
});
