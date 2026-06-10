import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum NotificationType {
  COURSE = 'COURSE',
  PAYMENT = 'PAYMENT',
  CERTIFICATE = 'CERTIFICATE',
  SYSTEM = 'SYSTEM',
}

@Entity('ThongBao')
export class ThongBao {
  @PrimaryGeneratedColumn({ name: 'MaTB' })
  maTB!: number;

  @Column({ name: 'MaND', type: 'int' })
  maND!: number;

  @Column({ name: 'MaNguoiGui', type: 'int', nullable: true })
  maNguoiGui!: number | null;

  @Column({
    name: 'LoaiThongBao',
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  loaiThongBao!: NotificationType;

  @Column({ name: 'TieuDe', type: 'varchar', length: 255 })
  tieuDe!: string;

  @Column({ name: 'NoiDung', type: 'text' })
  noiDung!: string;

  @Column({ name: 'DaDoc', type: 'tinyint', width: 1, default: false })
  daDoc!: boolean;

  @CreateDateColumn({ name: 'ThoiGian', type: 'datetime' })
  thoiGian!: Date;
}
