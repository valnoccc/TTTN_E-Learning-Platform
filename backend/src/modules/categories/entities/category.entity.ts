import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('DanhMuc')
export class Category {
    @PrimaryGeneratedColumn({ name: 'MaDM' })
    maDM!: number;

    @Column({ name: 'TenDM', type: 'nvarchar', length: 255 })
    tenDM!: string;

    @Column({ name: 'MoTa', type: 'nvarchar', length: 500, nullable: true })
    moTa?: string;
}