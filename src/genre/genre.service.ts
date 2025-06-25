import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Genre } from './entity/genre.entity';
import { Repository } from 'typeorm';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class GenreService {
  constructor(
    // @InjectRepository(Genre)
    // private readonly genreRepo: Repository<Genre>,
    private readonly prisma: PrismaService,
  ) {}
  async create(createGenreDto: CreateGenreDto) {
    const genre = await this.prisma.genre.findFirst({
      where: { name: createGenreDto.name },
    });
    // const genre = await this.genreRepo.findOne({
    //   where: { name: createGenreDto.name },
    // });
    if (genre) {
      throw new NotFoundException('이미 존재하는 장르입니다.');
    }
    return this.prisma.genre.create({
      data: createGenreDto,
    });
    // return this.genreRepo.save(createGenreDto);
  }

  findAll() {
    return this.prisma.genre.findMany();
    //return this.genreRepo.find();
  }

  findOne(id: number) {
    return this.prisma.genre.findUnique({
      where: {
        id,
      },
    });
    // return this.genreRepo.findOne({
    //   where: {
    //     id,
    //   },
    // });
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
    });
    // const genre = await this.genreRepo.findOne({
    //   where: { id },
    // });
    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');
    }

    await this.prisma.genre.update({
      where: { id },
      data: { ...updateGenreDto },
    });
    // await this.genreRepo.update(
    //   {
    //     id,
    //   },
    //   { ...updateGenreDto },
    // );
    return await this.prisma.genre.findUnique({
      where: { id },
    });
    // return await this.genreRepo.findOne({
    //   where: {
    //     id,
    //   },
    // });
  }

  async remove(id: number) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
    });
    // const genre = await this.genreRepo.findOne({
    //   where: { id },
    // });
    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');
    }

    await this.prisma.genre.delete({
      where: { id },
    });
    // await this.genreRepo.delete(id);

    return id;
  }
}
