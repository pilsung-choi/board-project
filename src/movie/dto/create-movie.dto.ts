import { IsNotEmpty } from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  gerne: string;

  @IsNotEmpty()
  detail: string;

  @IsNotEmpty()
  directorId: number;
}
