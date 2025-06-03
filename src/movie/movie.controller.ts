import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  Request,
  UseGuards,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entities/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from 'src/common/interceptor/transation.interceptor';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { pipe } from 'rxjs';
import { MovieFilePipe } from './pipe/movie-file.pipe';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @Public()
  getMovies(@Query() dto: GetMoviesDto) {
    return this.movieService.getManyMovies(dto);
  }

  @Get(':id')
  @Public()
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.getMovieById(id);
  }

  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  @UseInterceptors(
    FileInterceptor('movie', {
      limits: {
        fileSize: 40 * 1024 * 1024, // 20MB,
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'video/mp4') {
          return cb(new BadRequestException('MP4 타입만 업로드 가능'), false);
        }

        return cb(null, true); // Accept all files for now
      },
    }),
  )
  postMovie(
    @Body() body: CreateMovieDto,
    @Request() req, //: any,
    @UploadedFile()
    movie: Express.Multer.File,
  ) {
    console.log('Files:---------', movie);
    return this.movieService.createMovie(body, req.queryRunner);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.updateMovie(+id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id', ParseIntPipe) id: string) {
    return this.movieService.deleteMovie(+id);
  }
}
