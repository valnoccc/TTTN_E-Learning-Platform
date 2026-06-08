import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service'; // Đường dẫn tới service của bạn
import { Multer } from 'multer';

@Controller('cloudinary')
export class CloudinaryController {
    constructor(private readonly cloudinaryService: CloudinaryService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        // Gọi đến hàm upload của CloudinaryService sẵn có trong dự án của bạn
        const result = await this.cloudinaryService.uploadFile(file);
        return {
            url: result.secure_url || result.url,
        };
    }
}