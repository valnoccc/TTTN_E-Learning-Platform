import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Lesson } from './lesson.entity';
import { VideoBaiHoc } from './video-bai-hoc.entity';

@Entity('LichSuPublicVideo')
export class LichSuPublicVideo {
  @PrimaryGeneratedColumn({ name: 'MaLichSu', type: 'bigint' })
  maLichSu!: number;

  @Column({ name: 'MaVideo', type: 'bigint' })
  maVideo!: number;

  @ManyToOne(() => VideoBaiHoc, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'MaVideo' })
  video!: VideoBaiHoc;

  @Column({ name: 'MaBH', type: 'int' })
  maBH!: number;

  @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'MaBH' })
  baiHoc!: Lesson;

  @Column({ name: 'MaAdmin', type: 'int', nullable: true })
  maAdmin?: number | null;

  @Column({ name: 'HanhDong', type: 'varchar', length: 30 })
  hanhDong!: string;

  @Column({ name: 'GhiChu', type: 'varchar', length: 1000, nullable: true })
  ghiChu?: string | null;

  @CreateDateColumn({ name: 'NgayThucHien', type: 'datetime' })
  ngayThucHien!: Date;
}
