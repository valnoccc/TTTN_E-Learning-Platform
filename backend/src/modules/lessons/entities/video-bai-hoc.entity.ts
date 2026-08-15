import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lesson } from './lesson.entity';

export enum VideoVersionStatus {
  DRAFT = 'DRAFT',
  PUBLIC = 'PUBLIC',
  ARCHIVED = 'ARCHIVED',
}

@Entity('VideoBaiHoc')
export class VideoBaiHoc {
  @PrimaryGeneratedColumn({ name: 'MaVideo', type: 'bigint' })
  maVideo!: number;

  @Column({ name: 'MaBH', type: 'int' })
  maBH!: number;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'MaBH' })
  baiHoc!: Lesson;

  @Column({ name: 'GcsObjectName', type: 'varchar', length: 500 })
  gcsObjectName!: string;

  @Column({ name: 'GcsGeneration', type: 'varchar', length: 100, nullable: true })
  gcsGeneration?: string | null;

  @Column({ name: 'VideoURL', type: 'varchar', length: 1024, nullable: true })
  videoURL?: string | null;

  @Column({
    name: 'TrangThai',
    type: 'enum',
    enum: VideoVersionStatus,
    default: VideoVersionStatus.DRAFT,
  })
  trangThai!: VideoVersionStatus;

  @Column({ name: 'VideoSourceType', type: 'varchar', length: 20, default: 'UPLOAD' })
  videoSourceType!: string;

  @Column({ name: 'DurationSeconds', type: 'int', default: 0 })
  durationSeconds!: number;

  @Column({ name: 'Resolution', type: 'int', nullable: true })
  resolution?: number | null;

  @Column({ name: 'AiStatus', type: 'varchar', length: 30, nullable: true })
  aiStatus?: string | null;

  @Column({ name: 'AiLabels', type: 'json', nullable: true })
  aiLabels?: string[] | null;

  @Column({ name: 'AiRejectReason', type: 'varchar', length: 1000, nullable: true })
  aiRejectReason?: string | null;

  @CreateDateColumn({ name: 'NgayTao', type: 'datetime' })
  ngayTao!: Date;

  @Column({ name: 'NgayCongBo', type: 'datetime', nullable: true })
  ngayCongBo?: Date | null;

  @Column({ name: 'NgayLuuTru', type: 'datetime', nullable: true })
  ngayLuuTru?: Date | null;
}
