import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ViGiangVien')
export class ViGiangVien {
  @PrimaryGeneratedColumn({ name: 'MaVi' })
  maVi!: number;

  @Column({ name: 'MaND', type: 'int', unique: true })
  maND!: number;

  @Column({ name: 'SoDuKhaDung', type: 'decimal', precision: 18, scale: 2, default: 0 })
  soDuKhaDung!: string;

  @Column({ name: 'SoDuDangRut', type: 'decimal', precision: 18, scale: 2, default: 0 })
  soDuDangRut!: string;

  @Column({ name: 'TongDoanhThu', type: 'decimal', precision: 18, scale: 2, default: 0 })
  tongDoanhThu!: string;

  @Column({ name: 'TongDaChi', type: 'decimal', precision: 18, scale: 2, default: 0 })
  tongDaChi!: string;

  @CreateDateColumn({ name: 'NgayTao', type: 'datetime' })
  ngayTao!: Date;

  @UpdateDateColumn({ name: 'NgayCapNhat', type: 'datetime' })
  ngayCapNhat!: Date;
}
