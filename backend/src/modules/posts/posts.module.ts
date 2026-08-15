import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaiViet } from './entities/post.entity';
import { PostCategory } from './entities/post-category.entity';
import { PostsService } from './posts.service';
import { PostCategoriesService } from './post-categories.service';
import { PublicPostsController } from './controllers/public-posts.controller';
import { AdminPostsController } from './controllers/admin-posts.controller';
import { ArticlesController } from './controllers/articles.controller';
import { AdminPostCategoriesController } from './controllers/admin-post-categories.controller';
import { PublicPostCategoriesController } from './controllers/public-post-categories.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([BaiViet, PostCategory]), NotificationsModule],
  controllers: [
    PublicPostsController,
    AdminPostsController,
    ArticlesController,
    AdminPostCategoriesController,
    PublicPostCategoriesController,
  ],
  providers: [PostsService, PostCategoriesService],
  exports: [PostsService, PostCategoriesService],
})
export class PostsModule {}
