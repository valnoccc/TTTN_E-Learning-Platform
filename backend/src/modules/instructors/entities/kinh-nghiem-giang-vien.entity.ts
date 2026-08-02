import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('KinhNghiemGiangVien')
export class KinhNghiemGiangVien {
  @PrimaryGeneratedColumn()
  MaKinhNghiem!: number;

  @Column({ type: 'int' })
  MaHoSo!: number;

  @Column({ type: 'nvarchar', length: 255 })
  TenDonVi!: string;

  @Column({ type: 'nvarchar', length: 255 })
  ChucVu!: string;

  @Column({ type: 'smallint', nullable: true })
  NamBatDau!: number | null;

  @Column({ type: 'smallint', nullable: true })
  NamKetThuc!: number | null;

  @Column({ type: 'tinyint', default: 0 })
  DangLamViec!: boolean;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  MoTa!: string | null;

  @Column({ type: 'int', default: 0 })
  ThuTu!: number;
}
