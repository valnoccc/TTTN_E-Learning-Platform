import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { KhoaHoc } from '../../courses/entities/course.entity';

@Entity('BaiHoc')
export class Lesson {
    @PrimaryGeneratedColumn({ name: 'MaBH' })
    maBH!: number;

    @Column({ name: 'MaKH' })
    maKH!: number;

    @Column({ name: 'TenBaiHoc', type: 'varchar', length: 255 })
    tenBaiHoc!: string;

    @Column({ name: 'VideoURL', type: 'varchar', length: 255, nullable: true })
    videoURL?: string;

    @Column({ name: 'ThuTu', type: 'int' })
    thuTu!: number;

    @ManyToOne(() => KhoaHoc)
    @JoinColumn({ name: 'MaKH' })
    khoaHoc!: KhoaHoc;
}