import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TheTuDienDan } from './the-tu-dien-dan.entity';
import { CauTraLoiDienDan } from './cau-tra-loi-dien-dan.entity';
import { OneToMany } from 'typeorm';

@Entity('CauHoiDienDan')
export class CauHoiDienDan {
  @PrimaryGeneratedColumn({ name: 'MaCH' })
  maCH!: number;

  @Column({ name: 'TieuDe', type: 'varchar', length: 255 })
  tieuDe!: string;

  @Column({ name: 'NoiDung', type: 'text' })
  noiDung!: string;

  @Column({ name: 'LuotXem', type: 'int', default: 0 })
  luotXem!: number;

  @Column({ name: 'LuotBinhChon', type: 'int', default: 0 })
  luotBinhChon!: number;

  @Column({ name: 'SoCauTraLoi', type: 'int', default: 0 })
  soCauTraLoi!: number;

  @Column({ name: 'NguoiThich', type: 'simple-array', nullable: true })
  nguoiThich!: number[];

  @CreateDateColumn({ name: 'NgayTao', type: 'timestamp' })
  ngayTao!: Date;

  @UpdateDateColumn({ name: 'NgayCapNhat', type: 'timestamp' })
  ngayCapNhat!: Date;

  @Column({ name: 'MaND', type: 'int' })
  maND!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'MaND' })
  tacGia!: User;

  @ManyToMany(() => TheTuDienDan, (theTu) => theTu.danhSachCauHoi)
  @JoinTable({
    name: 'CauHoi_TheTu',
    joinColumn: { name: 'MaCH', referencedColumnName: 'maCH' },
    inverseJoinColumn: { name: 'MaThe', referencedColumnName: 'maThe' },
  })
  danhSachThe!: TheTuDienDan[];

  @OneToMany(() => CauTraLoiDienDan, (cauTraLoi) => cauTraLoi.cauHoi)
  danhSachTraLoi!: CauTraLoiDienDan[];
}
