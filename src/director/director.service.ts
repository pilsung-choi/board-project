import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Director } from './entity/director.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DirectorService {
  constructor(
    @InjectRepository(Director)
    private readonly directorRepo: Repository<Director>,
  ) {}
  create(createDirectorDto: CreateDirectorDto) {
    return this.directorRepo.save(createDirectorDto);
  }

  findAll() {
    return this.directorRepo.find();
  }

  findOne(id: number) {
    return this.directorRepo.findOne({
      where: {
        id,
      },
    });
  }

  async update(id: number, updateDirectorDto: UpdateDirectorDto) {
    const director = await this.directorRepo.findOne({
      where: {
        id,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    await this.directorRepo.update(
      {
        id,
      },
      { ...updateDirectorDto },
    );

    const newDirector = await this.directorRepo.findOne({
      where: {
        id,
      },
    });

    return newDirector;
  }

  async remove(id: number) {
    const director = await this.directorRepo.findOne({
      where: {
        id,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다.');
    }

    await this.directorRepo.delete(id);

    return id;
  }
}
