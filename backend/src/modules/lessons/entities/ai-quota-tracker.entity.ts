import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('AiQuotaTracker')
export class AiQuotaTracker {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id!: number;

  /**
   * Format: 'MM-YYYY', ví dụ: '06-2026'
   * UNIQUE - mỗi tháng chỉ có 1 record
   */
  @Column({ name: 'MonthYear', type: 'varchar', length: 10, unique: true })
  monthYear!: string;

  /**
   * Tổng số giây đã gọi Google Video Intelligence API trong tháng
   * 60.000 giây = 1.000 phút (hạn mức miễn phí)
   */
  @Column({ name: 'UsedSeconds', type: 'int', default: 0 })
  usedSeconds!: number;

  @UpdateDateColumn({ name: 'UpdatedAt', type: 'timestamp' })
  updatedAt!: Date;
}
