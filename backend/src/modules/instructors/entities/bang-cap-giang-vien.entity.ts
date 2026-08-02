import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('BangCapGiangVien')
export class BangCapGiangVien {
  @PrimaryGeneratedColumn()
  MaBangCap!: number;

  @Column({ type: 'int' })
  MaHoSo!: number;

  @Column({ type: 'nvarchar', length: 255 })
  TenTruong!: string;

  @Column({ type: 'nvarchar', length: 255 })
  TenBangCap!: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  ChuyenNganh!: string | null;

  @Column({ type: 'smallint', nullable: true })
  NamBatDau!: number | null;

  @Column({ type: 'smallint', nullable: true })
  NamKetThuc!: number | null;

  @Column({ type: 'int', default: 0 })
  ThuTu!: number;
}
