import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('khoahoc')
export class KhoaHoc {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255 })
    ten_khoa_hoc!: string;

    @Column({ type: 'text', nullable: true })
    mo_ta!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    gia!: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    hinh_anh!: string;

    @Column({
        type: 'enum',
        enum: ['DRAFT', 'PENDING', 'PUBLISHED', 'HIDDEN'],
        default: 'DRAFT',
    })
    trang_thai: string;

    @Column({ nullable: true })
    id_danh_muc!: number;

    // Cột này dùng để truy vấn ID trực tiếp
    @Column({ nullable: true })
    id_giang_vien!: number;

    @CreateDateColumn()
    ngay_tao!: Date;

    // Quan hệ ManyToOne với bảng nguoi_dung
    @ManyToOne(() => User)
    @JoinColumn({ name: 'id_giang_vien' })
    giangVien!: User;
}