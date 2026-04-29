import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
    async uploadFile(file: Express.Multer.File, type: 'video' | 'image' = 'image'): Promise<any> {
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                {
                    resource_type: type,
                    folder: type === 'video' ? 'lessons_videos' : 'course_thumbnails',
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                },
            );
            // Dùng Readable.from() để convert buffer sang stream
            Readable.from(file.buffer).pipe(upload);
        });
    }

    async deleteFile(publicId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            // Rất quan trọng: Phải có { resource_type: 'video' }
            cloudinary.uploader.destroy(publicId, { resource_type: 'video' }, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });
    }
}
