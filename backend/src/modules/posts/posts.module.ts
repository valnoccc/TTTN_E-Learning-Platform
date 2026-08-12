import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaiViet } from './entities/post.entity';
import { PostsService } from './posts.service';
import { PublicPostsController } from './controllers/public-posts.controller';
import { AdminPostsController } from './controllers/admin-posts.controller';
import { ArticlesController } from './controllers/articles.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([BaiViet]), NotificationsModule],
  controllers: [PublicPostsController, AdminPostsController, ArticlesController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
