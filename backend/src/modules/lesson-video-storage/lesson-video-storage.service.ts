import {
  InternalServerErrorException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface LessonVideoUploadFile {
  buffer: Buffer;
  mimetype?: string;
  originalname?: string;
}

export interface LessonVideoUploadResult {
  bucketName: string;
  objectName: string;
  url: string;
  gcsUri: string;
}

@Injectable()
export class LessonVideoStorageService {
  private readonly logger = new Logger(LessonVideoStorageService.name);
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.getRequiredConfig('GCS_BUCKET_NAME');
    const projectId = this.configService.get<string>('GCP_PROJECT_ID')?.trim();

    this.storage = new Storage(
      projectId
        ? {
            projectId,
          }
        : undefined,
    );
  }

  async uploadVideo(
    file: LessonVideoUploadFile,
    options: {
      courseId?: number;
      lessonId?: number;
    } = {},
  ): Promise<LessonVideoUploadResult> {
    const objectName = this.buildObjectName(file, options);
    const bucket = this.storage.bucket(this.bucketName);
    const gcsFile = bucket.file(objectName);

    try {
      await gcsFile.save(file.buffer, {
        resumable: false,
        metadata: {
          contentType: file.mimetype || 'video/mp4',
          cacheControl: 'public, max-age=31536000',
        },
      });

      return {
        bucketName: this.bucketName,
        objectName,
        url: this.buildPublicUrl(objectName),
        gcsUri: this.buildGcsUri(objectName),
      };
    } catch {
      await gcsFile.delete({ ignoreNotFound: true }).catch(() => undefined);
      throw new InternalServerErrorException(
        'Khong the tai video len Google Cloud Storage.',
      );
    }
  }

  async deleteVideo(videoUrl: string | null | undefined): Promise<void> {
    const objectName = this.extractObjectName(videoUrl);
    if (!objectName) {
      return;
    }

    try {
      await this.storage
        .bucket(this.bucketName)
        .file(objectName)
        .delete({ ignoreNotFound: true });
      this.logger.log(`Da xoa video tren GCS: ${objectName}`);
    } catch (error) {
      this.logger.warn(
        `Khong the xoa video GCS ${objectName}. URL goc: ${videoUrl}`,
      );
      this.logger.debug(error);
    }
  }

  async getPlayableUrl(videoUrl: string | null | undefined): Promise<string | null> {
    const objectName = this.extractObjectName(videoUrl);
    if (!objectName) {
      return videoUrl ?? null;
    }

    try {
      const [signedUrl] = await this.storage
        .bucket(this.bucketName)
        .file(objectName)
        .getSignedUrl({
          action: 'read',
          version: 'v4',
          expires: Date.now() + 60 * 60 * 1000,
        });

      return signedUrl;
    } catch (error) {
      this.logger.warn(
        `Khong the tao signed URL cho video ${objectName}. URL goc: ${videoUrl}`,
      );
      this.logger.debug(error);
      return videoUrl ?? null;
    }
  }

  extractObjectName(videoUrl: string | null | undefined): string | null {
    if (!videoUrl) {
      return null;
    }

    try {
      if (videoUrl.startsWith('gs://')) {
        const withoutScheme = videoUrl.slice('gs://'.length);
        const firstSlashIndex = withoutScheme.indexOf('/');
        if (firstSlashIndex <= 0) {
          return null;
        }

        const bucketName = withoutScheme.slice(0, firstSlashIndex);
        if (bucketName !== this.bucketName) {
          return null;
        }

        return decodeURIComponent(withoutScheme.slice(firstSlashIndex + 1));
      }

      const parsedUrl = new URL(videoUrl);
      const hostname = parsedUrl.hostname.toLowerCase();

      if (hostname === 'storage.googleapis.com') {
        const parts = parsedUrl.pathname.split('/').filter(Boolean);
        if (parts.length < 2) {
          return null;
        }

        const [bucketName, ...objectParts] = parts;
        if (bucketName !== this.bucketName) {
          return null;
        }

        return decodeURIComponent(objectParts.join('/'));
      }

      if (hostname === `${this.bucketName}.storage.googleapis.com`) {
        return decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ''));
      }

      return null;
    } catch {
      return null;
    }
  }

  private buildObjectName(
    file: LessonVideoUploadFile,
    options: {
      courseId?: number;
      lessonId?: number;
    },
  ): string {
    const folderParts = ['lessons-videos'];
    if (options.courseId) {
      folderParts.push(`course-${options.courseId}`);
    }
    if (options.lessonId) {
      folderParts.push(`lesson-${options.lessonId}`);
    }

    const extension = this.resolveExtension(file);
    return `${folderParts.join('/')}/${uuidv4()}${extension}`;
  }

  private resolveExtension(file: LessonVideoUploadFile): string {
    const originalNameExtension = file.originalname
      ? extname(file.originalname)
      : '';
    if (originalNameExtension) {
      return originalNameExtension;
    }

    const mimeType = file.mimetype?.toLowerCase() ?? '';
    if (mimeType.includes('mp4')) return '.mp4';
    if (mimeType.includes('webm')) return '.webm';
    if (mimeType.includes('quicktime')) return '.mov';
    if (mimeType.includes('x-matroska')) return '.mkv';

    return '.mp4';
  }

  private buildPublicUrl(objectName: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${encodeURI(objectName)}`;
  }

  private buildGcsUri(objectName: string): string {
    return `gs://${this.bucketName}/${objectName}`;
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return value;
  }
}
