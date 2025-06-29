import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { envVariableKeys } from 'src/common/const/env.const';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    /** typeORM */
    // const user = await this.userRepository.findOne({
    //   where: {
    //     email,
    //   },
    // });

    if (user) {
      throw new BadRequestException('이미 가입한 유저입니다.');
    }

    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>(envVariableKeys.hashRounds),
    );

    await this.prisma.user.create({
      data: {
        email,
        password: hash,
      },
    });

    /** typeORM */
    // await this.userRepository.save({
    //   email,
    //   password: hash,
    // });

    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    /** typeORM */
    // return this.userRepository.findOne({
    //   where: {
    //     email,
    //   },
    // });
  }

  findAll() {
    return this.prisma.user.findMany();
    /** typeORM */
    // return this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    // const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('존재하지 않은 사용자 입니다.');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password } = updateUserDto;
    const user = await this.prisma.user.findUnique({ where: { id } });
    // const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('존재하지 않은 사용자 입니다.');
    }

    let input: Prisma.UserUpdateInput = {
      ...updateUserDto,
    };

    if (password) {
      const hash = await bcrypt.hash(
        password,
        this.configService.get<number>(envVariableKeys.hashRounds),
      );

      input = {
        ...input,
        password: hash,
      };
    }

    await this.prisma.user.update({
      where: {
        id,
      },
      data: input,
    });

    // await this.userRepository.update(id, {
    //   ...updateUserDto,
    //   password: hash,
    // });

    return this.prisma.user.findUnique({ where: { id } });
    // return this.userRepository.findOne({ where: { id } });
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    // const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('존재하지 않은 사용자 입니다.');
    }

    await this.prisma.user.delete({ where: { id } });
    //await this.userRepository.delete(id);

    return id;
  }
}
