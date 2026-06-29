import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { KhoaHoc } from '../../courses/entities/course.entity';

export enum AiStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('BaiHoc')
export class Lesson {
  @PrimaryGeneratedColumn({ name: 'MaBH' })
  maBH!: number;

  @Column({ name: 'MaKH' })
  maKH!: number;

  @Column({ name: 'TenBaiHoc', type: 'varchar', length: 255 })
  tenBaiHoc!: string;

  @Column({ name: 'VideoURL', type: 'varchar', length: 255, nullable: true })
  videoURL?: string;

  @Column({ name: 'ThuTu', type: 'int' })
  thuTu!: number;

  @Column({ name: 'ThoiLuong', type: 'int', default: 0 })
  thoiLuong!: number;

  @Column({
    name: 'choPhepXemTruoc',
    type: 'boolean',
    default: false,
  })
  choPhepXemTruoc!: boolean;

  @ManyToOne(() => KhoaHoc)
  @JoinColumn({ name: 'MaKH' })
  khoaHoc!: KhoaHoc;

  @Column({
    name: 'AiStatus',
    type: 'enum',
    enum: AiStatus,
    nullable: true,
    default: null,
  })
  aiStatus?: AiStatus | null;

  @Column({ name: 'AiLabels', type: 'json', nullable: true })
  aiLabels?: string[] | null;

  @Column({ name: 'AiRejectReason', type: 'varchar', length: 500, nullable: true })
  aiRejectReason?: string | null;

  @Column({ name: 'DurationSeconds', type: 'int', default: 0 })
  durationSeconds!: number;
}
