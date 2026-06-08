import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

export interface UploadedAsset {
  buffer: Buffer;
}

@Injectable()
export class CloudinaryService {
  async uploadFile(
    file: UploadedAsset,
    type: 'video' | 'image' = 'image',
  ): Promise<any> {
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

      Readable.from(file.buffer).pipe(upload);
    });
  }

  async deleteFile(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: resourceType },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  }

  // HÀM TRỢ GIÚP: Bóc tách Public ID từ một URL Cloudinary bất kỳ
  extractPublicId(url: string): string | null {
    if (!url || !url.includes('cloudinary.com')) return null;

    try {
      // Tách chuỗi theo cụm /upload/
      const parts = url.split('/upload/');
      if (parts.length < 2) return null;

      // Lấy phần đuôi sau cụm /upload/ (bỏ v123456/ nếu có)
      const remainingPath = parts[1].replace(/^v\d+\//, '');

      // Loại bỏ phần định dạng file (.jpg, .png, .mp4...) ở cuối cùng
      const publicId = remainingPath.substring(0, remainingPath.lastIndexOf('.'));

      return publicId;
    } catch (error) {
      console.error('Không thể bóc tách Public ID từ URL:', error);
      return null;
    }
  }
}
