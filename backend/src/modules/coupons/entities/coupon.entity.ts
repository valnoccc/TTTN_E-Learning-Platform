import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { KhoaHoc } from '../../courses/entities/course.entity';

@Entity('MaGiamGia')
export class Coupon {
  @PrimaryGeneratedColumn({ name: 'MaCoupon' })
  maCoupon!: number;

  @Column({ name: 'MaCode', type: 'varchar', length: 50, unique: true })
  maCode!: string;

  @Column({
    name: 'GiaTriGiam',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  giaTriGiam!: number;

  @Column({
    name: 'LoaiGiam',
    type: 'enum',
    enum: ['PERCENT', 'AMOUNT'],
    default: 'PERCENT',
  })
  loaiGiam!: 'PERCENT' | 'AMOUNT';

  @Column({
    name: 'TrangThai',
    type: 'enum',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
  })
  trangThai!: 'ACTIVE' | 'INACTIVE';

  @Column({ name: 'NgayBatDau', type: 'datetime', nullable: true })
  ngayBatDau!: Date | null;

  @Column({ name: 'NgayKetThuc', type: 'datetime', nullable: true })
  ngayKetThuc!: Date | null;

  @Column({ name: 'MaKH' })
  maKH!: number;

  @Column({ name: 'MaND_GiangVien' })
  maND_GiangVien!: number;

  @Column({ name: 'SoLuongGioiHan', type: 'int', nullable: true })
  soLuongGioiHan!: number | null;

  @Column({ name: 'SoLuongDaDung', type: 'int', default: 0 })
  soLuongDaDung!: number;

  @Column({ name: 'GhiChu', type: 'varchar', length: 255, nullable: true })
  ghiChu!: string | null;

  @ManyToOne(() => KhoaHoc)
  @JoinColumn({ name: 'MaKH' })
  khoaHoc!: KhoaHoc;
}
