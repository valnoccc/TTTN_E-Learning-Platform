import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('BaiViet')
export class BaiViet {
  @PrimaryGeneratedColumn({ name: 'MaBV' })
  maBV!: number;

  @Column({ name: 'TieuDe', type: 'varchar', length: 255 })
  tieuDe!: string;

  @Column({ name: 'Slug', type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ name: 'TomTat', type: 'text', nullable: true })
  tomTat?: string;

  @Column({ name: 'NoiDung', type: 'longtext', nullable: true })
  noiDung?: string;

  @Column({ name: 'HinhAnh', type: 'varchar', length: 255, nullable: true })
  hinhAnh?: string;

  @Column({ name: 'LuotXem', type: 'int', default: 0 })
  luotXem!: number;

  @Column({
    name: 'TrangThai',
    type: 'enum',
    enum: ['DRAFT', 'PUBLISHED'],
    default: 'DRAFT',
  })
  trangThai!: string;

  @Column({ name: 'MaND_TacGia', type: 'int' })
  maND_TacGia!: number;

  @CreateDateColumn({ name: 'NgayTao', type: 'datetime' })
  ngayTao!: Date;

  @UpdateDateColumn({ name: 'NgayCapNhat', type: 'datetime' })
  ngayCapNhat!: Date;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'MaND_TacGia' })
  tacGia!: User;
}
