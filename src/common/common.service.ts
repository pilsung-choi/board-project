import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { PagePaginationDto } from './dto/page-pagenation.dto';
import { CursorPaginationDto } from './dto/cursor-page-pagination.dto';

@Injectable()
export class CommonService {
  constructor() {}

  applyPagePaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: PagePaginationDto,
  ) {
    const { take, page } = dto;
    const skip = (page - 1) * take;

    qb.skip(skip);
    qb.take(take);
  }

  applyCursorPaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto,
  ) {
    const { order, id, take } = dto;

    if (id) {
      const direction = order === 'ASC' ? '>' : '<';

      // order => ASC : movie.id > :id
      qb.where(`${qb.alias}.id ${direction} :id`, { id });
    }

    qb.orderBy(`${qb.alias}.id`, order);

    qb.take(take);
  }
}
