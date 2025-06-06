import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';

const mockGenreService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('GenreController', () => {
  let genreController: GenreController;
  let genreService: GenreService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [
        {
          provide: GenreService,
          useValue: mockGenreService,
        },
      ],
    }).compile();
    genreController = module.get<GenreController>(GenreController);
    genreService = module.get<GenreService>(GenreService);
  });

  it('should be defined', () => {
    expect(genreController).toBeDefined();
  });

  describe('create', () => {
    it('should create new genre', async () => {
      const createGenreDto = { name: 'action' };
      const createdGenre = { id: 1, name: 'action' };

      jest.spyOn(mockGenreService, 'create').mockResolvedValue(createdGenre);

      const result = await genreController.create(createGenreDto);

      expect(result).toEqual(createdGenre);
      expect(genreService.create).toHaveBeenCalledWith(createGenreDto);
    });
  });

  describe('findAll', () => {
    it('should return all genres', async () => {
      const genres = [{ id: 1, name: 'action' }];

      jest.spyOn(mockGenreService, 'findAll').mockResolvedValue(genres);

      const result = await genreController.findAll();

      expect(result).toEqual(genres);
      expect(genreService.findAll).toHaveBeenCalled;
    });
  });

  describe('create', () => {
    it('should create new genre', async () => {
      const id = 1;

      jest.spyOn(mockGenreService, 'findOne').mockResolvedValue(id);

      const result = await genreController.findOne(id);

      expect(result).toEqual(id);
      expect(genreService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update the genre by id', async () => {
      const id = 1;
      const updateGenreDto = { name: 'action' };
      const updatedGenre = { id: 1, name: 'action' };

      jest.spyOn(mockGenreService, 'update').mockResolvedValue(updatedGenre);

      const result = await genreController.update(id, updateGenreDto);

      expect(result).toEqual(updatedGenre);
      expect(genreService.update).toHaveBeenCalledWith(id, updateGenreDto);
    });
  });

  describe('remove', () => {
    it('should remove a genre by id', async () => {
      const id = 1;

      jest.spyOn(mockGenreService, 'remove').mockResolvedValue(id);

      const result = await genreController.remove(id);

      expect(result).toEqual(id);
      expect(genreService.remove).toHaveBeenCalledWith(id);
    });
  });
});
