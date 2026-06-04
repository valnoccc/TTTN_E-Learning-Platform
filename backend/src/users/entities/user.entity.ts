import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum UserRole {
    ADMIN = 'ADMIN',
    INSTRUCTOR = 'INSTRUCTOR',
    STUDENT = 'STUDENT',
}

@Entity('NguoiDung')
export class User {
    @PrimaryGeneratedColumn({ name: 'MaND' })
    maND!: number;

    @Column({ name: 'HoTen', type: 'varchar', length: 255 })
    hoTen!: string;

    @Column({ name: 'Email', type: 'varchar', length: 191, unique: true })
    email!: string;

    @Column({ name: 'MatKhau', type: 'varchar', length: 255 })
    matKhau!: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.STUDENT,
        name: 'VaiTro'
    })
    vaiTro!: UserRole;

    @Column({ name: 'AnhDaiDien', type: 'varchar', length: 255, nullable: true })
    anhDaiDien?: string;

    @CreateDateColumn({ name: 'NgayTao', type: 'timestamp' })
    ngayTao!: Date;
}