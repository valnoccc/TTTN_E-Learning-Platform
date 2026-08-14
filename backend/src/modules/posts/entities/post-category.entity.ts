import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BaiViet } from './post.entity';

@Entity('DanhMucBaiViet')
export class PostCategory {
  @PrimaryGeneratedColumn({ name: 'MaDMBV' })
  maDMBV!: number;

  @Column({ name: 'TenDMBV', type: 'nvarchar', length: 255 })
  tenDMBV!: string;

  @Column({ name: 'Slug', type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ name: 'MoTa', type: 'text', nullable: true })
  moTa?: string;

  @OneToMany(() => BaiViet, post => post.category)
  posts!: BaiViet[];
}
