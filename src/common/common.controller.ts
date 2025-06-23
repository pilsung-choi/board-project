import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Controller('common')
@ApiBearerAuth()
export class CommonController {
  constructor(
    private readonly commonService: CommonService,
    // @InjectQueue('thumbnail-generation')
    // private readonly thumbnailQueue: Queue,
  ) {}
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
  async createVideo(
    @UploadedFile()
    movie: Express.Multer.File,
  ) {
    // await this.thumbnailQueue.add(
    //   'thumbnail',
    //   {
    //     videoId: movie.filename,
    //     videoPath: movie.path,
    //   },
    //   {
    //     priority: 1,
    //     delay: 100,
    //     attempts: 3,
    //     lifo: true,
    //     removeOnComplete: true,
    //     removeOnFail: true,
    //   },
    // );
    return { filename: movie.filename };
  }

  @Post('presigned-url')
  async createPresignedUrl() {
    return {
      url: await this.commonService.createPresignedUrl(),
    };
  }
}
