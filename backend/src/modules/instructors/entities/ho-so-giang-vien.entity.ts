import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

// Đảm bảo đường dẫn này trỏ đúng đến file chứa entity bảng NguoiDung của bạn
import { User } from '../../users/entities/user.entity';

@Entity('HoSoGiangVien')
export class HoSoGiangVien {
  @PrimaryGeneratedColumn()
  MaHoSo!: number;

  @Column({ type: 'int' })
  MaND!: number;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  TieuSu!: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  ChuyenMon!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  SoTaiKhoan!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  FacebookURL!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  InstagramURL!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  GitHubURL!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  WebsiteURL!: string;

  // Quan hệ 1-1 với bảng NguoiDung (Tuỳ chọn: Nếu bạn không cần join trực tiếp bằng ORM thì có thể bỏ khối này)
  @OneToOne(() => User)
  @JoinColumn({ name: 'MaND' })
  user!: User;
}
