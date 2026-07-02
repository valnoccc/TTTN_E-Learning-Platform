import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { KhoaHoc } from '../../courses/entities/course.entity';

@Entity('NhacNhoHocTap')
export class LearningReminder {
  @PrimaryGeneratedColumn({ name: 'MaNN' })
  maNN: number;

  @Column({ name: 'MaND' })
  maND: number;

  @Column({ name: 'MaKH', nullable: true })
  maKH: number;

  @Column({ name: 'TenNhacNho', type: 'varchar', length: 255, default: 'Nhắc nhở học tập' })
  tenNhacNho: string;

  @Column({ name: 'TanSuat', type: 'varchar', length: 50 })
  tanSuat: string; // 'HANG_NGAY', 'HANG_TUAN', 'MOT_LAN'

  @Column({ name: 'ThoiGian', type: 'time' })
  thoiGian: string;

  @Column({ name: 'CacThu', type: 'varchar', length: 100, nullable: true })
  cacThu: string; // 'T2,T4,T6'

  @Column({ name: 'NgayCuThe', type: 'date', nullable: true })
  ngayCuThe: Date;

  @Column({ name: 'TrangThai', type: 'boolean', default: true })
  trangThai: boolean;

  @CreateDateColumn({ name: 'NgayTao' })
  ngayTao: Date;

  @UpdateDateColumn({ name: 'NgayCapNhat' })
  ngayCapNhat: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'MaND' })
  user: User;

  @ManyToOne(() => KhoaHoc)
  @JoinColumn({ name: 'MaKH' })
  course: KhoaHoc;
}
