import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaiViet } from './entities/post.entity';
import { PostsService } from './posts.service';
import { PublicPostsController } from './controllers/public-posts.controller';
import { AdminPostsController } from './controllers/admin-posts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BaiViet])],
  controllers: [PublicPostsController, AdminPostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
