import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
} from 'typeorm';
import { CauHoiDienDan } from './cau-hoi-dien-dan.entity';

@Entity('TheTuDienDan')
export class TheTuDienDan {
  @PrimaryGeneratedColumn({ name: 'MaThe' })
  maThe!: number;

  @Column({ name: 'TenThe', type: 'varchar', length: 100 })
  tenThe!: string;

  @Column({ name: 'DuongDan', type: 'varchar', length: 100, unique: true })
  duongDan!: string;

  @ManyToMany(() => CauHoiDienDan, (cauHoi) => cauHoi.danhSachThe)
  danhSachCauHoi!: CauHoiDienDan[];
}
