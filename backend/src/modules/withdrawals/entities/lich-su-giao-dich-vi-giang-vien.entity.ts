import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export const InstructorWalletTransactionTypes = [
  'REVENUE_CREDIT',
  'WITHDRAWAL_HOLD',
  'WITHDRAWAL_RELEASE',
  'WITHDRAWAL_PAYOUT',
] as const;

export type InstructorWalletTransactionType =
  (typeof InstructorWalletTransactionTypes)[number];

@Entity('LichSuGiaoDichViGiangVien')
export class LichSuGiaoDichViGiangVien {
  @PrimaryGeneratedColumn({ name: 'MaLichSu', type: 'bigint' })
  maLichSu!: string;

  @Column({ name: 'MaVi', type: 'int' })
  maVi!: number;

  @Column({ name: 'MaND', type: 'int' })
  maND!: number;

  @Column({ name: 'LoaiGiaoDich', type: 'varchar', length: 40 })
  loaiGiaoDich!: InstructorWalletTransactionType;

  @Column({ name: 'SoTien', type: 'decimal', precision: 18, scale: 2 })
  soTien!: string;

  @Column({ name: 'SoDuKhaDungTruoc', type: 'decimal', precision: 18, scale: 2 })
  soDuKhaDungTruoc!: string;

  @Column({ name: 'SoDuKhaDungSau', type: 'decimal', precision: 18, scale: 2 })
  soDuKhaDungSau!: string;

  @Column({ name: 'SoDuDangRutTruoc', type: 'decimal', precision: 18, scale: 2 })
  soDuDangRutTruoc!: string;

  @Column({ name: 'SoDuDangRutSau', type: 'decimal', precision: 18, scale: 2 })
  soDuDangRutSau!: string;

  @Column({ name: 'MaHoaDon', type: 'int', nullable: true })
  maHoaDon?: number | null;

  @Column({ name: 'MaKhoaHoc', type: 'int', nullable: true })
  maKhoaHoc?: number | null;

  @Column({ name: 'MaYeuCauRut', type: 'bigint', nullable: true })
  maYeuCauRut?: string | null;

  @Column({ name: 'KhoaIdempotency', type: 'varchar', length: 160, unique: true })
  khoaIdempotency!: string;

  @Column({ name: 'GhiChu', type: 'nvarchar', length: 500, nullable: true })
  ghiChu?: string | null;

  @CreateDateColumn({ name: 'NgayTao', type: 'datetime' })
  ngayTao!: Date;
}
