import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { v4 } from 'uuid';
import { rename } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MovieFilePipe
  implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>>
{
  constructor(
    private readonly options: {
      maxSize: number;
      mimeType: string;
    },
  ) {}

  async transform(
    value: any,
    metadata: ArgumentMetadata,
  ): Promise<Express.Multer.File> {
    if (!value) {
      throw new BadRequestException('movie 필드는 필수입니다.');
    }

    const byteSize = this.options.maxSize * 1024 * 1024; // Convert MB to bytes

    if (value.size > byteSize) {
      throw new BadRequestException(
        `파일 크기는 ${this.options.maxSize}MB를 초과할 수 없습니다.`,
      );
    }

    if (value.mimetype !== this.options.mimeType) {
      throw new BadRequestException(
        `파일 타입은 ${this.options.mimeType}만 허용됩니다.`,
      );
    }

    const split = value.originalname.split('.');
    let extension = 'mp4';

    if (split.length > 1) {
      extension = split[split.length - 1];
    }

    const filename = `${v4()}_${Date.now()}.${extension}`;

    const newPath = join(value.destination, filename);

    await rename(value.path, newPath);

    return {
      ...value,
      filename,
      path: newPath,
    };
  }
}
