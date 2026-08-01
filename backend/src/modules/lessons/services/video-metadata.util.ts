/**
 * video-metadata.util.ts
 *
 * Utility để đọc metadata video (duration, resolution) từ một Buffer tạm thời.
 * Sử dụng fluent-ffmpeg với graceful fallback nếu ffmpeg binary không có sẵn.
 *
 * Nếu ffmpeg không tồn tại, hàm sẽ trả về null thay vì throw lỗi.
 */
import { BadRequestException, Logger } from '@nestjs/common';
import { writeFile, unlink, mkdtemp } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const logger = new Logger('VideoMetadataUtil');

export interface VideoMetadata {
  /** Thời lượng video tính bằng giây */
  duration: number;
  /** Độ phân giải theo chiều cao (px). VD: 1080, 720, 480 */
  resolution: number | null;
}

const MAX_DURATION_SECONDS = 10800; // 3 giờ
const MAX_RESOLUTION_HEIGHT = 1080; // 1080p

/**
 * Kiểm tra xem fluent-ffmpeg và ffmpeg binary có sẵn không.
 * Trả về module nếu có, null nếu không.
 */
async function tryLoadFfmpeg(): Promise<any | null> {
  try {
    // Dynamic import để tránh crash nếu package không được cài
    const ffmpeg = await import('fluent-ffmpeg');
    return ffmpeg.default ?? ffmpeg;
  } catch {
    logger.warn('fluent-ffmpeg không có sẵn. Bỏ qua kiểm tra metadata video.');
    return null;
  }
}

/**
 * Đọc metadata từ buffer video.
 * @param buffer Buffer của file video
 * @param originalname Tên file gốc (dùng để xác định extension)
 * @returns VideoMetadata hoặc null nếu không đọc được
 */
export async function extractVideoMetadata(
  buffer: Buffer,
  originalname = 'video.mp4',
): Promise<VideoMetadata | null> {
  const ffmpegModule = await tryLoadFfmpeg();
  if (!ffmpegModule) {
    return null;
  }

  // Ghi buffer ra file tạm
  let tmpDir: string | null = null;
  let tmpFilePath: string | null = null;

  try {
    tmpDir = await mkdtemp(join(tmpdir(), 'elearning-video-'));
    const ext = originalname.split('.').pop() ?? 'mp4';
    tmpFilePath = join(tmpDir, `tmp_video.${ext}`);
    await writeFile(tmpFilePath, buffer);

    const metadata = await new Promise<VideoMetadata>((resolve, reject) => {
      ffmpegModule.ffprobe(tmpFilePath, (err: Error | null, data: any) => {
        if (err) {
          reject(err);
          return;
        }

        const duration = Math.round(data?.format?.duration ?? 0);
        const videoStream = data?.streams?.find(
          (s: any) => s.codec_type === 'video',
        );
        const resolution: number | null = videoStream?.height ?? null;

        resolve({ duration, resolution });
      });
    });

    return metadata;
  } catch (err) {
    logger.warn('Không thể đọc metadata video:', err);
    return null;
  } finally {
    // Dọn file tạm
    if (tmpFilePath) {
      try {
        await unlink(tmpFilePath);
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Validate metadata video theo giới hạn hệ thống.
 * Throw BadRequestException nếu vi phạm.
 */
export function validateVideoMetadata(metadata: VideoMetadata): void {
  if (metadata.duration > MAX_DURATION_SECONDS) {
    const hours = (metadata.duration / 3600).toFixed(1);
    throw new BadRequestException(
      `Video quá dài: ${hours} giờ. Hệ thống chỉ chấp nhận video tối đa 3 giờ (${MAX_DURATION_SECONDS} giây).`,
    );
  }

  if (
    metadata.resolution !== null &&
    metadata.resolution > MAX_RESOLUTION_HEIGHT
  ) {
    throw new BadRequestException(
      `Độ phân giải video quá cao: ${metadata.resolution}p. Hệ thống chỉ chấp nhận tối đa ${MAX_RESOLUTION_HEIGHT}p (1080p).`,
    );
  }
}
