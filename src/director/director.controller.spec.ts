import { Test, TestingModule } from '@nestjs/testing';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { CreateDirectorDto } from './dto/create-director.dto';

const mockDirectorService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('DirectorController', () => {
  let directorController: DirectorController;
  let directorService: DirectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectorController],
      providers: [
        {
          provide: DirectorService,
          useValue: mockDirectorService,
        },
      ],
    }).compile();
    directorController = module.get<DirectorController>(DirectorController);
    directorService = module.get<DirectorService>(DirectorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(directorController).toBeDefined();
  });

  describe('findAll', () => {
    it('should call findAll method from DirectorService', () => {
      const directors = [
        {
          id: 1,
          name: 'bong',
        },
      ];

      jest.spyOn(mockDirectorService, 'findAll').mockResolvedValue(directors);

      expect(directorController.findAll()).resolves.toEqual(directors);
      expect(directorService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should retrun a director by id', async () => {
      const director = {
        id: 1,
        name: 'bong',
      };

      jest.spyOn(mockDirectorService, 'findOne').mockResolvedValue(director);

      expect(directorController.findOne(1)).resolves.toEqual(director);
      expect(directorService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a new director', async () => {
      const createDirectorDto = {
        name: 'bong',
        dob: new Date(),
        nationality: 'usa',
      };
      const result = { id: 1, name: 'bong' };

      jest.spyOn(mockDirectorService, 'create').mockResolvedValue(result);

      expect(directorController.create(createDirectorDto)).resolves.toEqual(
        result,
      );
      expect(directorService.create).toHaveBeenCalledWith(createDirectorDto);
    });
  });

  describe('update', () => {
    it('shuould return updated a director by id', async () => {
      const result = {
        id: 1,
        name: 'nolan',
      };
      const updateDirectorDto = {
        name: 'nolan',
      };

      jest.spyOn(mockDirectorService, 'update').mockResolvedValue(result);

      expect(directorController.update(1, updateDirectorDto)).resolves.toEqual(
        result,
      );
      expect(directorService.update).toHaveBeenCalledWith(1, updateDirectorDto);
    });
  });

  describe('Delete', () => {
    it('should delete a director by id', async () => {
      jest.spyOn(mockDirectorService, 'remove').mockResolvedValue(1);

      expect(directorController.remove(1)).resolves.toEqual(1);
      expect(directorService.remove).toHaveBeenCalledWith(1);
    });
  });
});
