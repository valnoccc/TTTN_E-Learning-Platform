import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CauHoiDienDan } from './cau-hoi-dien-dan.entity';

@Entity('CauTraLoiDienDan')
export class CauTraLoiDienDan {
  @PrimaryGeneratedColumn({ name: 'MaCTL' })
  maCTL!: number;

  @Column({ name: 'NoiDung', type: 'text' })
  noiDung!: string;

  @Column({ name: 'LuotBinhChon', type: 'int', default: 0 })
  luotBinhChon!: number;

  @Column({ name: 'NguoiThich', type: 'simple-array', nullable: true })
  nguoiThich!: number[];

  @Column({ name: 'LaDapAnDung', type: 'boolean', default: false })
  laDapAnDung!: boolean;

  @CreateDateColumn({ name: 'NgayTao', type: 'timestamp' })
  ngayTao!: Date;

  @UpdateDateColumn({ name: 'NgayCapNhat', type: 'timestamp' })
  ngayCapNhat!: Date;

  @Column({ name: 'MaND', type: 'int' })
  maND!: number;

  @Column({ name: 'MaCH', type: 'int' })
  maCH!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'MaND' })
  tacGia!: User;

  @ManyToOne(() => CauHoiDienDan, (cauHoi) => cauHoi.danhSachTraLoi, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'MaCH' })
  cauHoi!: CauHoiDienDan;

  @Column({ name: 'MaCTL_Cha', type: 'int', nullable: true })
  maCTL_Cha!: number | null;

  @ManyToOne(() => CauTraLoiDienDan, (traLoi) => traLoi.cacPhanHoi, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'MaCTL_Cha' })
  cauTraLoiCha!: CauTraLoiDienDan;

  @OneToMany(() => CauTraLoiDienDan, (traLoi) => traLoi.cauTraLoiCha)
  cacPhanHoi!: CauTraLoiDienDan[];
}
