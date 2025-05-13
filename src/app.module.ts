import { Module } from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { MovieModule } from './movie/movie.module';

@Module({
  imports: [PostsModule, MovieModule],
})
export class AppModule {}
