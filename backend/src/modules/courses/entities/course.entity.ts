import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('KhoaHoc')
export class KhoaHoc {
  @PrimaryGeneratedColumn({ name: 'MaKH' })
  maKH!: number;

  @Column({ name: 'MaDM' })
  maDM!: number;

  @Column({ name: 'MaND_GiangVien' })
  maND_GiangVien!: number;

  @Column({ name: 'TenKhoaHoc', type: 'varchar', length: 255 })
  tenKhoaHoc!: string;

  @Column({ name: 'MoTa', type: 'text', nullable: true })
  moTa?: string;

  @Column({
    name: 'GiaBan',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  giaBan!: number;

  @Column({
    type: 'enum',
    enum: ['DRAFT', 'PUBLISHED', 'BANNED', 'PENDING'],
    default: 'DRAFT',
    name: 'TrangThai',
  })
  trangThai!: string;

  @Column({ name: 'HinhThuNho', type: 'varchar', length: 255, nullable: true })
  hinhThuNho?: string;

  @Column({ name: 'KetQuaHocTap', type: 'text', nullable: true })
  ketQuaHocTap?: string;

  @Column({ name: 'YeuCauKhoaHoc', type: 'text', nullable: true })
  yeuCauKhoaHoc?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'MaND_GiangVien' })
  giangVien!: User;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'MaDM' })
  danhMuc!: Category;
}
