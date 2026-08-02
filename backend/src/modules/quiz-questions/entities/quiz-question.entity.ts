import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum QuizAnswerKey {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

@Entity('CauHoiTracNghiem')
export class QuizQuestion {
  @PrimaryGeneratedColumn({ name: 'MaCauHoi' })
  maCauHoi!: number;

  @Column({ name: 'MaChuong', type: 'int' })
  maChuong!: number;

  @Column({ name: 'NoiDung', type: 'text' })
  noiDung!: string;

  @Column({ name: 'DapAnA', type: 'varchar', length: 500 })
  dapAnA!: string;

  @Column({ name: 'DapAnB', type: 'varchar', length: 500 })
  dapAnB!: string;

  @Column({ name: 'DapAnC', type: 'varchar', length: 500 })
  dapAnC!: string;

  @Column({ name: 'DapAnD', type: 'varchar', length: 500 })
  dapAnD!: string;

  @Column({ name: 'DapAnDung', type: 'enum', enum: QuizAnswerKey })
  dapAnDung!: QuizAnswerKey;

  @Column({ name: 'ThuTu', type: 'int', default: 1 })
  thuTu!: number;

  @Column({
    name: 'NgayTao',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  ngayTao!: Date;

  @Column({
    name: 'NgayCapNhat',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  ngayCapNhat!: Date;
}
