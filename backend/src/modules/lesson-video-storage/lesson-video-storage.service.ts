import {
  InternalServerErrorException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { DataSource } from 'typeorm';
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
export class LessonVideoStorageService implements OnModuleInit {
  private readonly logger = new Logger(LessonVideoStorageService.name);
  private readonly storage: Storage;
  private readonly bucketName: string;
  private storageQuotaSchemaReady: Promise<void> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.bucketName = this.getRequiredConfig('GCS_BUCKET_NAME');
    const projectId = this.configService.get<string>('GCP_PROJECT_ID')?.trim();
    const privateKeyJson = this.configService
      .get<string>('GCS_PRIVATE_KEY_JSON')
      ?.trim();
    const credentials = privateKeyJson
      ? this.parseCredentials(privateKeyJson)
      : undefined;

    this.storage = new Storage({
      ...(projectId ? { projectId } : {}),
      ...(credentials ? { credentials } : {}),
    });
  }

  async onModuleInit() {
    await this.ensureStorageQuotaSchema();
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

  async recordMonthlyUsage(bytes: number): Promise<void> {
    const normalizedBytes = Math.max(0, Math.round(Number(bytes ?? 0) || 0));
    if (normalizedBytes <= 0) {
      return;
    }

    try {
      await this.ensureStorageQuotaSchema();
      const monthYear = this.getCurrentMonthYear();
      await this.dataSource.query(
        `INSERT INTO VideoStorageQuotaTracker (MonthYear, UsedBytes)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE UsedBytes = UsedBytes + ?`,
        [monthYear, normalizedBytes, normalizedBytes],
      );
    } catch (error) {
      this.logger.error('Khong the cap nhat storage quota tracker:', error);
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

  private async ensureStorageQuotaSchema() {
    if (!this.storageQuotaSchemaReady) {
      this.storageQuotaSchemaReady = (async () => {
        await this.dataSource.query(
          `CREATE TABLE IF NOT EXISTS \`VideoStorageQuotaTracker\` (
            \`Id\` int NOT NULL AUTO_INCREMENT,
            \`MonthYear\` varchar(10) NOT NULL,
            \`UsedBytes\` bigint NOT NULL DEFAULT 0,
            \`UpdatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`Id\`),
            UNIQUE KEY \`UQ_VideoStorageQuotaTracker_MonthYear\` (\`MonthYear\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        );
      })();
    }

    return this.storageQuotaSchemaReady;
  }

  private getCurrentMonthYear(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${month}-${year}`;
  }

  private getStorageQuotaLimitBytes(): number {
    const fromEnv = Number(process.env.VIDEO_STORAGE_MONTHLY_LIMIT_GB ?? 100);
    const limitGb = Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 100;
    return limitGb * 1024 * 1024 * 1024;
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return value;
  }

  private parseCredentials(rawJson: string) {
    try {
      return JSON.parse(rawJson) as Record<string, string>;
    } catch {
      throw new Error('Missing or invalid configuration: GCS_PRIVATE_KEY_JSON');
    }
  }
}
