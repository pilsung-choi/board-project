import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CommonService } from './common.service';

@Controller('common')
@ApiBearerAuth()
export class CommonController {
  constructor(private readonly commonService: CommonService) {}
  @Post('video')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: {
        fileSize: 40 * 1024 * 1024, // 40MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'video/mp4') {
          return cb(new Error('Only mp4 videos are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  createVideo(
    @UploadedFile()
    movie: Express.Multer.File,
  ) {
    return { filename: movie.filename };
  }

  @Post('presigned-url')
  async createPresignedUrl() {
    return {
      url: await this.commonService.createPresignedUrl(),
    };
  }
}
