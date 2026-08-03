import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const WithdrawalStatuses = [
  'PENDING',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
] as const;

export type WithdrawalStatus = (typeof WithdrawalStatuses)[number];

@Entity('YeuCauRutTien')
export class YeuCauRutTien {
  @PrimaryGeneratedColumn({ name: 'MaYeuCauRut', type: 'bigint' })
  maYeuCauRut!: string;

  @Column({ name: 'MaVi', type: 'int' })
  maVi!: number;

  @Column({ name: 'MaND', type: 'int' })
  maND!: number;

  @Column({ name: 'SoTien', type: 'decimal', precision: 18, scale: 2 })
  soTien!: string;

  @Column({ name: 'SoDuKhaDungTruoc', type: 'decimal', precision: 18, scale: 2 })
  soDuKhaDungTruoc!: string;

  @Column({ name: 'SoDuKhaDungSau', type: 'decimal', precision: 18, scale: 2 })
  soDuKhaDungSau!: string;

  @Column({ name: 'SoTaiKhoan', type: 'varchar', length: 50 })
  soTaiKhoan!: string;

  @Column({ name: 'MaNganHang', type: 'varchar', length: 20 })
  maNganHang!: string;

  @Column({ name: 'TenNganHang', type: 'nvarchar', length: 150 })
  tenNganHang!: string;

  @Column({ name: 'TenChuTaiKhoan', type: 'nvarchar', length: 150 })
  tenChuTaiKhoan!: string;

  @Column({ name: 'TrangThai', type: 'varchar', length: 20, default: 'PENDING' })
  trangThai!: WithdrawalStatus;

  @Column({ name: 'LyDoTuChoi', type: 'nvarchar', length: 500, nullable: true })
  lyDoTuChoi?: string | null;

  @Column({ name: 'GhiChuAdmin', type: 'nvarchar', length: 500, nullable: true })
  ghiChuAdmin?: string | null;

  @Column({ name: 'MaGiaoDichNgoaiHeThong', type: 'varchar', length: 120, nullable: true })
  maGiaoDichNgoaiHeThong?: string | null;

  @Column({ name: 'MaAdminXuLy', type: 'int', nullable: true })
  maAdminXuLy?: number | null;

  @CreateDateColumn({ name: 'NgayTao', type: 'datetime' })
  ngayTao!: Date;

  @Column({ name: 'NgayXuLy', type: 'datetime', nullable: true })
  ngayXuLy?: Date | null;

  @UpdateDateColumn({ name: 'NgayCapNhat', type: 'datetime' })
  ngayCapNhat!: Date;
}
