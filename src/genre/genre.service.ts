import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Genre } from './entities/genre.entity';
import { Repository } from 'typeorm';
import { PassThrough } from 'stream';
import { asyncWrapProviders } from 'async_hooks';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepo: Repository<Genre>,
  ) {}
  create(createGenreDto: CreateGenreDto) {
    return this.genreRepo.save(createGenreDto);
  }

  findAll() {
    return this.genreRepo.find();
  }

  findOne(id: number) {
    return this.genreRepo.findOne({
      where: {
        id,
      },
    });
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = await this.genreRepo.findOne({
      where: { id },
    });
    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');
    }

    await this.genreRepo.update(
      {
        id,
      },
      { ...updateGenreDto },
    );
    return await this.genreRepo.findOne({
      where: {
        id,
      },
    });
  }

  async remove(id: number) {
    const genre = await this.genreRepo.findOne({
      where: { id },
    });
    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');
    }

    await this.genreRepo.delete(id);

    return id;
  }
}
