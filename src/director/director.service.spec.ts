import { Test, TestingModule } from '@nestjs/testing';
import { DirectorService } from './director.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Director } from './entity/director.entity';
import { Repository } from 'typeorm';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { NotFoundException } from '@nestjs/common';

const mockDirectorRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
};

describe('DirectorService', () => {
  let directorService: DirectorService;
  let directorRepo: Repository<Director>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectorService,
        {
          provide: getRepositoryToken(Director),
          useValue: mockDirectorRepo,
        },
      ],
    }).compile();

    directorService = module.get<DirectorService>(DirectorService);
    directorRepo = module.get<Repository<Director>>(
      getRepositoryToken(Director),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new director and return it', async () => {
      // Given
      const createDirectorDto: CreateDirectorDto = {
        name: 'test',
        dob: new Date(),
        nationality: 'korea',
      };

      jest.spyOn(mockDirectorRepo, 'save').mockResolvedValue(createDirectorDto);

      // When
      const result = await directorService.create(createDirectorDto);

      // Then
      expect(result).toEqual(createDirectorDto);
      expect(directorRepo.save).toHaveBeenCalledWith(createDirectorDto);
    });
  });

  describe('findAll', () => {
    it('should return all directors', async () => {
      const directors = [
        {
          id: 1,
          name: 'nolan',
        },
        {
          id: 2,
          name: 'bong',
        },
      ];

      jest
        .spyOn(directorRepo, 'find')
        .mockResolvedValue(directors as Director[]);

      const result = await directorService.findAll();

      expect(result).toEqual(directors);
      expect(directorRepo.find).toHaveBeenCalled;
    });
  });

  describe('findOne', () => {
    it('should return a director by id', async () => {
      const director = {
        id: 1,
        name: 'nolan',
      };

      jest
        .spyOn(directorRepo, 'findOne')
        .mockResolvedValue(director as Director);

      const result = await directorService.findOne(director.id);

      expect(result).toEqual(director);
      expect(directorRepo.findOne).toHaveBeenCalledWith({
        where: {
          id: director.id,
        },
      });
    });
  });

  describe('update', () => {
    it('should return updated director', async () => {
      const updateDirectorDto = { name: 'code factory2' };
      const exitingDirector = { id: 1, name: 'code factory' };
      const updatedDirector = { id: 1, name: 'code factory2' };
      // const director = {
      //   id: 1,
      //   name: 'nolan',
      // };
      // const updateDirectorDto = {
      //   name: 'bong',
      // };

      jest
        .spyOn(mockDirectorRepo, 'findOne')
        .mockResolvedValue(exitingDirector);
      jest
        .spyOn(mockDirectorRepo, 'findOne')
        .mockResolvedValue(updatedDirector);

      const result = await directorService.update(1, updateDirectorDto);

      expect(directorRepo.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
      expect(directorRepo.update).toHaveBeenCalledWith(
        {
          id: 1,
        },
        updateDirectorDto,
      );
      expect(result).toEqual(updatedDirector);
    });

    it('should throw NotFoundException if director does not exit', async () => {
      jest.spyOn(mockDirectorRepo, 'findOne').mockResolvedValue(null);

      expect(
        directorService.update(1, { name: 'code factory' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a director by id', async () => {
      const director = {
        id: 1,
        name: 'nolan',
      };

      jest.spyOn(mockDirectorRepo, 'findOne').mockResolvedValue(director);

      const result = await directorService.remove(1);

      expect(directorRepo.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
      expect(directorRepo.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(1);
    });

    it('should throw NotFoundException if director does not exit', async () => {
      jest.spyOn(mockDirectorRepo, 'findOne').mockResolvedValue(null);

      expect(directorService.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
