import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

const mockUserRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user and return it', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: '12341234',
      };
      const hashRounds = 10;
      const hashedPassword = 'hashedhashed';
      const result = {
        id: 1,
        email: 'test@test.com',
      };

      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation((password, hashRounds) => hashedPassword);
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValueOnce(result);

      const createdUser = await userService.create(createUserDto);

      expect(createdUser).toEqual(result);
      expect(mockUserRepo.findOne).toHaveBeenNthCalledWith(1, {
        where: {
          email: createUserDto.email,
        },
      });
      expect(mockUserRepo.findOne).toHaveBeenNthCalledWith(2, {
        where: {
          email: createUserDto.email,
        },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        hashRounds,
      );
      expect(mockUserRepo.save).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword,
      });
    });

    it('should throw a BadRequestException if email already exit', () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: '12341234',
      };
      const result = {
        id: 1,
        email: 'test@test.com',
      };

      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(result);

      expect(userService.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: {
          email: createUserDto.email,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        {
          id: 1,
          email: 'ps@codefactory.ai',
        },
      ];
      mockUserRepo.find.mockResolvedValue(users);

      const result = await userService.findAll();

      expect(result).toEqual(users);
      expect(mockUserRepo.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = { id: 1, email: 'ps@codefactory.ai' };

      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(user);

      const result = await userService.findOne(1);

      expect(result).toEqual(user);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if user does not found', async () => {
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(null);

      expect(userService.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('update', () => {
    it('should update a user if the user exit and return updated user', async () => {
      const updateUserDto = {
        email: 'test@test.com',
        password: '1234',
      };
      const hashed = 'hashedhashed';
      const hashRounds = 10;
      const user = {
        id: 1,
        email: 'test@test.com',
      };

      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation((data, saltRound) => hashed);
      jest.spyOn(mockUserRepo, 'update').mockResolvedValue(undefined);
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValueOnce({
        ...user,
        password: hashed,
      });

      const result = await userService.update(1, updateUserDto);

      expect(result).toEqual({
        ...user,
        password: hashed,
      });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: user.id },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        updateUserDto.password,
        hashRounds,
      );
      expect(mockUserRepo.update).toHaveBeenCalledWith(user.id, {
        ...updateUserDto,
        password: hashed,
      });
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: user.id },
      });
    });

    it('should throw NotFoundException if user to update is not found', async () => {
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(null);

      const updateUserDto: UpdateUserDto = {
        email: 'test@test.com',
        password: '1234',
      };

      expect(userService.update(999, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: {
          id: 999,
        },
      });
      expect(mockUserRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a user by id', async () => {
      const id = 999;

      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue({
        id: 1,
      });

      const result = await userService.remove(id);

      expect(result).toEqual(id);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: {
          id,
        },
      });
    });

    it('should throw NotFoundException if user does not found', () => {
      jest.spyOn(mockUserRepo, 'findOne').mockResolvedValue(null);

      expect(userService.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });
});
