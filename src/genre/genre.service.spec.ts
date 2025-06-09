import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { Repository } from 'typeorm';
import { Genre } from './entity/genre.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock } from 'node:test';
import { create } from 'node:domain';
import { NotFoundException } from '@nestjs/common';

const mockGenreRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
};

describe('GenreService', () => {
  let genreService: GenreService;
  let genreRepo: Repository<Genre>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenreService,
        {
          provide: getRepositoryToken(Genre),
          useValue: mockGenreRepo,
        },
      ],
    }).compile();

    genreService = module.get<GenreService>(GenreService);
    genreRepo = module.get<Repository<Genre>>(getRepositoryToken(Genre));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(genreService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new genre', async () => {
      const createGenreDto = { name: 'action' };
      const savedGenre = { id: 1, ...createGenreDto };

      jest.spyOn(mockGenreRepo, 'save').mockResolvedValue(savedGenre);
      //jest.spyOn(mockGenreRepo, 'findOne').mockResolvedValue(null);

      const result = await genreService.create(createGenreDto);

      expect(result).toEqual(savedGenre);
      //expect(mockGenreRepo.save).toHaveBeenCalledWith(createGenreDto);
    });

    it('should throw NotFoundException if a genre exit', async () => {
      const createGenreDto = { name: 'action' };
      const exiting = { id: 1, name: 'action' };

      jest.spyOn(mockGenreRepo, 'findOne').mockResolvedValue(exiting);

      expect(genreService.create(createGenreDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockGenreRepo.findOne).toHaveBeenCalledWith({
        where: { name: createGenreDto.name },
      });
    });
  });

  describe('findAll', () => {
    it('should return all genre', async () => {
      const genre = [{ id: 1, name: 'action' }];

      jest.spyOn(mockGenreRepo, 'find').mockResolvedValue(genre);

      const result = await genreService.findAll();

      expect(result).toEqual(genre);
    });
  });

  describe('findOne', () => {
    it('should return a genre by id', async () => {
      const genre = { id: 1, name: 'action' };

      jest.spyOn(mockGenreRepo, 'findOne').mockResolvedValue(genre);

      const result = await genreService.findOne(1);

      expect(result).toEqual(genre);
      expect(mockGenreRepo.findOne).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update genre by id', async () => {
      const exiting = { id: 1, name: 'action' };
      const updateGenreDto = { name: 'fantasy' };
      const updatedGenre = { id: 1, name: 'fantasy' };

      jest.spyOn(mockGenreRepo, 'findOne').mockResolvedValue(exiting);
      jest.spyOn(mockGenreRepo, 'findOne').mockResolvedValue(updatedGenre);

      const result = await genreService.update(1, updateGenreDto);

      expect(result).toEqual(updatedGenre);
      expect(mockGenreRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if genre does not exit', async () => {
      const updateGenreDto = { name: 'action' };
      jest.spyOn(mockGenreRepo, 'findOne').mockResolvedValue(null);

      expect(genreService.update(1, updateGenreDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove genre if genre exists', async () => {
      const id = 1;
      const genre = { id: 1, name: 'action' };

      jest.spyOn(mockGenreRepo, 'findOne').mockResolvedValue(genre);

      const result = await genreService.remove(1);

      expect(result).toBe(id);
      expect(mockGenreRepo.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when genre is not found by id', async () => {
      jest.spyOn(mockGenreRepo, 'findOne').mockResolvedValue(null);

      expect(genreService.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
