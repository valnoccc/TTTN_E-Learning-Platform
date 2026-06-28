import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum CourseModerationAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  BAN = 'BAN',
  HIDE = 'HIDE',
}

@Entity('LichSuKiemDuyetKhoaHoc')
export class CourseModerationHistory {
  @PrimaryGeneratedColumn({ name: 'MaLSKD' })
  maLSKD!: number;

  @Column({ name: 'MaKH' })
  maKH!: number;

  @Column({ name: 'MaND_Admin' })
  maND_Admin!: number;

  @Column({
    name: 'HanhDong',
    type: 'enum',
    enum: CourseModerationAction,
  })
  hanhDong!: CourseModerationAction;

  @Column({ name: 'GhiChu', type: 'text', nullable: true })
  ghiChu!: string | null;

  @CreateDateColumn({ name: 'ThoiGian', type: 'datetime' })
  thoiGian!: Date;
}
