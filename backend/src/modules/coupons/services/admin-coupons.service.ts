import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import {
  CreateAdminCouponDto,
  type AdminCouponRuleInput,
  type AdminCouponRuleType,
  type AdminCouponScopeType,
} from '../dto/create-admin-coupon.dto';
import { QueryCouponsDto } from '../dto/query-coupons.dto';
import { UpdateAdminCouponDto } from '../dto/update-admin-coupon.dto';
import { Coupon } from '../entities/coupon.entity';
import { KhoaHoc } from '../../courses/entities/course.entity';
import { CouponsService } from './coupons.service';

@Injectable()
export class AdminCouponsService
  extends CouponsService
  implements OnModuleInit
{
  private adminCouponSchemaReady: Promise<void> | null = null;

  constructor(
    @InjectRepository(Coupon)
    couponRepository: any,
    @InjectRepository(KhoaHoc)
    courseRepository: any,
    dataSource: DataSource,
  ) {
    super(couponRepository, courseRepository, dataSource);
  }

  async onModuleInit() {
    await this.ensureAdminCouponSchema();
  }

  private ensureAdminCouponSchema() {
    if (!this.adminCouponSchemaReady) {
      this.adminCouponSchemaReady = (async () => {
        await this.addColumnIfMissing(
          'MaGiamGia',
          'MaKM',
          'varchar(100) DEFAULT NULL AFTER `GhiChu`',
        );

        await this.addColumnIfMissing(
          'MaGiamGia',
          'LoaiKM',
          "enum('FIRST_TIME','CROSS_SELL','HOLIDAY','STANDARD') DEFAULT 'STANDARD' AFTER `MaKM`",
        );

        await this.dataSource.query(
          `CREATE TABLE IF NOT EXISTS \`MaGiamGiaDieuKien\` (
            \`MaDK\` int NOT NULL AUTO_INCREMENT,
            \`MaCoupon\` int NOT NULL,
            \`LoaiDieuKien\` enum(
              'NEW_USER_24H',
              'FIRST_PURCHASE',
              'COMBO_ONLY',
              'MIN_ORDER_VALUE',
              'MIN_COURSE_COUNT'
            ) NOT NULL,
            \`GiaTriDieuKien\` decimal(12,2) DEFAULT NULL,
            \`MoTa\` varchar(255) DEFAULT NULL,
            \`NgayTao\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`MaDK\`),
            KEY \`idx_coupon_rule_coupon\` (\`MaCoupon\`),
            KEY \`idx_coupon_rule_type\` (\`LoaiDieuKien\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,
        );

        await this.dataSource.query(
          `ALTER TABLE \`MaGiamGiaDieuKien\`
           MODIFY COLUMN \`LoaiDieuKien\` enum(
             'NEW_USER_24H',
             'FIRST_PURCHASE',
             'COMBO_ONLY',
             'MIN_ORDER_VALUE',
             'MIN_COURSE_COUNT',
             'ACCOUNT_AGE_HOURS',
             'REPEAT_PURCHASE',
             'NEW_USER_ONLY'
           ) NOT NULL`,
        );

        await this.addColumnIfMissing(
          'MaGiamGiaDieuKien',
          'GiaTriDieuKien',
          'decimal(12,2) DEFAULT NULL AFTER `LoaiDieuKien`',
        );

        await this.addColumnIfMissing(
          'MaGiamGiaDieuKien',
          'MoTa',
          'varchar(255) DEFAULT NULL AFTER `GiaTriDieuKien`',
        );

        await this.addColumnIfMissing(
          'MaGiamGiaDieuKien',
          'NgayTao',
          'datetime NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `MoTa`',
        );

        await this.dataSource.query(
          `CREATE TABLE IF NOT EXISTS \`MaGiamGiaPhamVi\` (
            \`MaPV\` int NOT NULL AUTO_INCREMENT,
            \`MaCoupon\` int NOT NULL,
            \`LoaiPhamVi\` enum('ALL','COURSE','CATEGORY','INSTRUCTOR') NOT NULL,
            \`MaDoiTuong\` int DEFAULT NULL,
            \`NgayTao\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`MaPV\`),
            KEY \`idx_coupon_scope_coupon\` (\`MaCoupon\`),
            KEY \`idx_coupon_scope_type\` (\`LoaiPhamVi\`),
            KEY \`idx_coupon_scope_target\` (\`MaDoiTuong\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,
        );

        await this.addColumnIfMissing(
          'MaGiamGiaPhamVi',
          'LoaiPhamVi',
          "enum('ALL','COURSE','CATEGORY','INSTRUCTOR') NOT NULL AFTER `MaCoupon`",
        );

        await this.addColumnIfMissing(
          'MaGiamGiaPhamVi',
          'MaDoiTuong',
          'int DEFAULT NULL AFTER `LoaiPhamVi`',
        );

        await this.addColumnIfMissing(
          'MaGiamGiaPhamVi',
          'NgayTao',
          'datetime NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `MaDoiTuong`',
        );

        await this.dataSource.query(
          `CREATE TABLE IF NOT EXISTS \`LichSuSuDungMaGiamGia\` (
            \`MaLSSD\` int NOT NULL AUTO_INCREMENT,
            \`MaCoupon\` int NOT NULL,
            \`MaND\` int NOT NULL,
            \`MaHD\` int NOT NULL,
            \`GiaTriDonHang\` decimal(12,2) NOT NULL DEFAULT '0.00',
            \`SoTienGiam\` decimal(12,2) NOT NULL DEFAULT '0.00',
            \`ThoiGianSuDung\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (\`MaLSSD\`),
            UNIQUE KEY \`uq_coupon_invoice\` (\`MaCoupon\`, \`MaHD\`),
            KEY \`idx_coupon_redemption_user\` (\`MaND\`),
            KEY \`idx_coupon_redemption_invoice\` (\`MaHD\`)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,
        );

        await this.addColumnIfMissing(
          'LichSuSuDungMaGiamGia',
          'GiaTriDonHang',
          "decimal(12,2) NOT NULL DEFAULT '0.00' AFTER `MaHD`",
        );

        await this.addColumnIfMissing(
          'LichSuSuDungMaGiamGia',
          'SoTienGiam',
          "decimal(12,2) NOT NULL DEFAULT '0.00' AFTER `GiaTriDonHang`",
        );

        await this.addColumnIfMissing(
          'LichSuSuDungMaGiamGia',
          'ThoiGianSuDung',
          'datetime NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `SoTienGiam`',
        );
      })();
    }

    return this.adminCouponSchemaReady;
  }

  private async addColumnIfMissing(
    tableName: string,
    columnName: string,
    definition: string,
  ) {
    if (await this.columnExists(tableName, columnName)) {
      return;
    }

    await this.dataSource.query(
      `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`,
    );
  }

  private async columnExists(tableName: string, columnName: string) {
    const rows = await this.dataSource.query(
      `
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
        LIMIT 1
      `,
      [tableName, columnName],
    );

    return Array.isArray(rows) && rows.length > 0;
  }

  async getAdminCoupons(query: QueryCouponsDto) {
    const normalizedSearch = query.search?.trim() ?? '';
    const normalizedStatus = query.status?.trim().toUpperCase();

    const conditions = ['1=1'];
    const params: Array<string | number> = [];

    if (normalizedSearch) {
      conditions.push('mg.MaCode LIKE ?');
      params.push(`%${normalizedSearch}%`);
    }

    if (normalizedStatus && ['ACTIVE', 'INACTIVE'].includes(normalizedStatus)) {
      conditions.push('mg.TrangThai = ?');
      params.push(normalizedStatus);
    }

    const rows = await this.dataSource.query(
      `SELECT
          mg.MaCoupon AS maCoupon,
          mg.MaCode AS maCode,
          mg.GiaTriGiam AS giaTriGiam,
          mg.LoaiGiam AS loaiGiam,
          mg.TrangThai AS trangThai,
          mg.NgayBatDau AS ngayBatDau,
          mg.NgayKetThuc AS ngayKetThuc,
          mg.MaKH AS maKH,
          kh.TenKhoaHoc AS tenKhoaHoc,
          mg.SoLuongGioiHan AS soLuongGioiHan,
          mg.SoLuongDaDung AS soLuongDaDung,
          mg.GhiChu AS ghiChu,
          mg.LoaiKM AS loaiKM
       FROM MaGiamGia mg
       LEFT JOIN KhoaHoc kh ON kh.MaKH = mg.MaKH
       WHERE ${conditions.join(' AND ')}
       ORDER BY mg.MaCoupon DESC`,
      params,
    );

    const summaryResult = await this.dataSource.query(
      `SELECT
          COUNT(*) AS totalCouponCount,
          SUM(CASE WHEN TrangThai = 'ACTIVE' THEN 1 ELSE 0 END) AS activeCount,
          COALESCE(SUM(SoLuongDaDung), 0) AS totalUsageCount
       FROM MaGiamGia`,
    );

    const summary = summaryResult[0] ?? {
      totalCouponCount: 0,
      activeCount: 0,
      totalUsageCount: 0,
    };

    return {
      summary: {
        totalCouponCount: Number(summary.totalCouponCount ?? 0),
        activeCount: Number(summary.activeCount ?? 0),
        totalUsageCount: Number(summary.totalUsageCount ?? 0),
      },
      items: rows.map((row) => this.normalizeCouponRow(row)),
    };
  }

  async createAdminCoupon(_adminId: number, payload: CreateAdminCouponDto) {
    const maCode = payload.maCode?.trim().toUpperCase();
    if (!maCode) {
      throw new BadRequestException('Mã giảm giá không được để trống');
    }
    const loaiGiam = payload.loaiGiam;
    const giaTriGiam = Number(payload.giaTriGiam);

    if (!['PERCENT', 'AMOUNT'].includes(loaiGiam)) {
      throw new BadRequestException('Loại giảm giá không hợp lệ');
    }

    if (!Number.isFinite(giaTriGiam) || giaTriGiam <= 0) {
      throw new BadRequestException('Giá trị giảm phải lớn hơn 0');
    }

    if (loaiGiam === 'PERCENT' && (giaTriGiam < 1 || giaTriGiam > 99)) {
      throw new BadRequestException('Mã phần trăm chỉ được phép từ 1 đến 99');
    }

    const soLuongGioiHan =
      payload.soLuongGioiHan === null || payload.soLuongGioiHan === undefined
        ? null
        : Number(payload.soLuongGioiHan);

    if (
      soLuongGioiHan !== null &&
      (!Number.isInteger(soLuongGioiHan) || soLuongGioiHan <= 0)
    ) {
      throw new BadRequestException(
        'Giới hạn lượt dùng phải là số nguyên dương',
      );
    }

    const normalizedScopeType: AdminCouponScopeType =
      payload.scopeType ?? (payload.scopeTargetIds?.length ? 'COURSE' : 'ALL');

    const scopeTargetIds = Array.isArray(payload.scopeTargetIds)
      ? [
          ...new Set(
            payload.scopeTargetIds
              .map((id) => Number(id))
              .filter((id) => Number.isInteger(id) && id > 0),
          ),
        ]
      : [];

    if (normalizedScopeType !== 'ALL' && scopeTargetIds.length === 0) {
      throw new BadRequestException(
        'Vui lòng chọn ít nhất một đối tượng áp dụng cho phạm vi này',
      );
    }

    const normalizedRules: Array<{
      loaiDieuKien: AdminCouponRuleType;
      giaTriDieuKien: number | null;
      moTa: string | null;
    }> = Array.isArray(payload.rules)
      ? payload.rules.map((rule: AdminCouponRuleInput) => {
          const ruleValue =
            rule.giaTriDieuKien === null || rule.giaTriDieuKien === undefined
              ? null
              : Number(rule.giaTriDieuKien);
          if (
            ruleValue !== null &&
            (!Number.isFinite(ruleValue) || ruleValue < 0)
          ) {
            throw new BadRequestException('Giá trị điều kiện không hợp lệ');
          }
          return {
            loaiDieuKien: rule.loaiDieuKien,
            giaTriDieuKien: ruleValue,
            moTa: rule.moTa?.trim() || null,
          };
        })
      : [];

    const ruleTypesNeedValue: AdminCouponRuleType[] = [
      'COMBO_ONLY',
      'MIN_ORDER_VALUE',
      'MIN_COURSE_COUNT',
      'ACCOUNT_AGE_HOURS',
    ];

    for (const rule of normalizedRules) {
      if (
        ruleTypesNeedValue.includes(rule.loaiDieuKien) &&
        rule.giaTriDieuKien === null
      ) {
        throw new BadRequestException('Điều kiện này cần nhập giá trị áp dụng');
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const maKH =
        normalizedScopeType === 'COURSE' && scopeTargetIds.length === 1
          ? scopeTargetIds[0]
          : null;
      const insertResult = await queryRunner.query(
        `INSERT INTO MaGiamGia (
          MaCode, GiaTriGiam, LoaiGiam, TrangThai, NgayBatDau, NgayKetThuc,
          MaKH, SoLuongGioiHan, SoLuongDaDung, MaND_GiangVien, GhiChu, MaKM, LoaiKM
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?, ?)`,
        [
          maCode,
          giaTriGiam,
          loaiGiam,
          payload.trangThai || 'ACTIVE',
          payload.ngayBatDau ? new Date(payload.ngayBatDau) : null,
          payload.ngayKetThuc ? new Date(payload.ngayKetThuc) : null,
          maKH,
          soLuongGioiHan,
          payload.ghiChu || null,
          payload.maKM || null,
          payload.loaiKM || null,
        ],
      );
      const couponId = insertResult.insertId;

      const scopeRows =
        normalizedScopeType === 'ALL'
          ? [{ loaiPhamVi: 'ALL' as const, maDoiTuong: null }]
          : scopeTargetIds.map((targetId) => ({
              loaiPhamVi: normalizedScopeType,
              maDoiTuong: targetId,
            }));

      for (const scopeRow of scopeRows) {
        await queryRunner.query(
          `INSERT INTO MaGiamGiaPhamVi (MaCoupon, LoaiPhamVi, MaDoiTuong) VALUES (?, ?, ?)`,
          [couponId, scopeRow.loaiPhamVi, scopeRow.maDoiTuong],
        );
      }

      for (const rule of normalizedRules) {
        await queryRunner.query(
          `INSERT INTO MaGiamGiaDieuKien (MaCoupon, LoaiDieuKien, GiaTriDieuKien, MoTa) VALUES (?, ?, ?, ?)`,
          [couponId, rule.loaiDieuKien, rule.giaTriDieuKien, rule.moTa],
        );
      }

      await queryRunner.commitTransaction();
      return { couponId, maCode };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Mã giảm giá đã tồn tại');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateAdminCoupon(
    _adminId: number,
    couponId: number,
    dto: UpdateAdminCouponDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ── 1. Kiểm tra tồn tại ──────────────────────────────────────────────
      const rows = await queryRunner.query(
        `SELECT MaCoupon, SoLuongDaDung FROM MaGiamGia WHERE MaCoupon = ? LIMIT 1`,
        [couponId],
      );
      if (!rows.length) {
        throw new NotFoundException('Mã giảm giá không tồn tại');
      }
      const existing = rows[0] as { MaCoupon: number; SoLuongDaDung: number };
      const soLuongDaDung = Number(existing.SoLuongDaDung ?? 0);
      const isLocked = soLuongDaDung > 0;

      // ── 2. Validate Nhóm 1: soLuongGioiHan ≥ soLuongDaDung ───────────────
      if (dto.soLuongGioiHan !== undefined && dto.soLuongGioiHan !== null) {
        const newLimit = Number(dto.soLuongGioiHan);
        if (!Number.isInteger(newLimit) || newLimit <= 0) {
          throw new BadRequestException(
            'Giới hạn lượt dùng phải là số nguyên dương',
          );
        }
        if (newLimit < soLuongDaDung) {
          throw new BadRequestException(
            `Giới hạn lượt dùng mới (${newLimit}) không được nhỏ hơn số lượt đã dùng (${soLuongDaDung})`,
          );
        }
      }

      if (dto.ngayKetThuc) {
        const endDate = new Date(dto.ngayKetThuc);
        if (isNaN(endDate.getTime()) || endDate <= new Date()) {
          throw new BadRequestException(
            'Ngày kết thúc phải lớn hơn thời điểm hiện tại',
          );
        }
      }

      // ── 3. Cập nhật Nhóm 1 (luôn cho phép) ─────────────────────────────
      const group1Updates: string[] = [];
      const group1Params: Array<string | number | null | Date> = [];

      if (dto.ghiChu !== undefined) {
        group1Updates.push('GhiChu = ?');
        group1Params.push(dto.ghiChu ?? null);
      }
      if (dto.ngayKetThuc !== undefined) {
        group1Updates.push('NgayKetThuc = ?');
        group1Params.push(
          dto.ngayKetThuc ? new Date(dto.ngayKetThuc) : null,
        );
      }
      if (dto.soLuongGioiHan !== undefined) {
        group1Updates.push('SoLuongGioiHan = ?');
        group1Params.push(dto.soLuongGioiHan ?? null);
      }
      if (dto.trangThai) {
        if (!['ACTIVE', 'INACTIVE'].includes(dto.trangThai)) {
          throw new BadRequestException('Trạng thái không hợp lệ');
        }
        group1Updates.push('TrangThai = ?');
        group1Params.push(dto.trangThai);
      }

      // ── 4. Cập nhật Nhóm 2 (chỉ khi soLuongDaDung === 0) ────────────────
      const group2Updates: string[] = [];
      const group2Params: Array<string | number | null> = [];

      if (!isLocked) {
        if (dto.maCode !== undefined) {
          const normalizedCode = dto.maCode.trim().toUpperCase();
          if (!normalizedCode) {
            throw new BadRequestException('Mã code không được để trống');
          }
          group2Updates.push('MaCode = ?');
          group2Params.push(normalizedCode);
        }
        if (dto.loaiGiam !== undefined) {
          if (!['PERCENT', 'AMOUNT'].includes(dto.loaiGiam)) {
            throw new BadRequestException('Loại giảm giá không hợp lệ');
          }
          group2Updates.push('LoaiGiam = ?');
          group2Params.push(dto.loaiGiam);
        }
        if (dto.giaTriGiam !== undefined) {
          const val = Number(dto.giaTriGiam);
          if (!Number.isFinite(val) || val <= 0) {
            throw new BadRequestException('Giá trị giảm phải lớn hơn 0');
          }
          // Validate percent range using the current or new loaiGiam
          const targetLoaiGiam = dto.loaiGiam ?? undefined;
          if (targetLoaiGiam === 'PERCENT' && (val < 1 || val > 99)) {
            throw new BadRequestException(
              'Mã phần trăm chỉ được phép từ 1 đến 99',
            );
          }
          group2Updates.push('GiaTriGiam = ?');
          group2Params.push(val);
        }
      }

      const allUpdates = [...group1Updates, ...group2Updates];
      const allParams = [...group1Params, ...group2Params];

      if (allUpdates.length > 0) {
        await queryRunner.query(
          `UPDATE MaGiamGia SET ${allUpdates.join(', ')} WHERE MaCoupon = ?`,
          [...allParams, couponId],
        );
      }

      // ── 5. Cập nhật phạm vi (scope) nếu được phép ────────────────────────
      if (!isLocked && dto.scopeType !== undefined) {
        const normalizedScopeType: AdminCouponScopeType =
          dto.scopeType ?? 'ALL';
        const scopeTargetIds = Array.isArray(dto.scopeTargetIds)
          ? [
              ...new Set(
                dto.scopeTargetIds
                  .map((id) => Number(id))
                  .filter((id) => Number.isInteger(id) && id > 0),
              ),
            ]
          : [];

        if (normalizedScopeType !== 'ALL' && scopeTargetIds.length === 0) {
          throw new BadRequestException(
            'Vui lòng chọn ít nhất một đối tượng áp dụng cho phạm vi này',
          );
        }

        // Xoá scope cũ, ghi scope mới
        await queryRunner.query(
          `DELETE FROM MaGiamGiaPhamVi WHERE MaCoupon = ?`,
          [couponId],
        );

        const scopeRows =
          normalizedScopeType === 'ALL'
            ? [{ loaiPhamVi: 'ALL' as const, maDoiTuong: null }]
            : scopeTargetIds.map((targetId) => ({
                loaiPhamVi: normalizedScopeType,
                maDoiTuong: targetId,
              }));

        for (const scopeRow of scopeRows) {
          await queryRunner.query(
            `INSERT INTO MaGiamGiaPhamVi (MaCoupon, LoaiPhamVi, MaDoiTuong) VALUES (?, ?, ?)`,
            [couponId, scopeRow.loaiPhamVi, scopeRow.maDoiTuong],
          );
        }

        // Cập nhật MaKH cho COURSE scope 1 mục
        const maKH =
          normalizedScopeType === 'COURSE' && scopeTargetIds.length === 1
            ? scopeTargetIds[0]
            : null;
        await queryRunner.query(
          `UPDATE MaGiamGia SET MaKH = ? WHERE MaCoupon = ?`,
          [maKH, couponId],
        );
      }

      // ── 6. Cập nhật điều kiện (rules) nếu được phép ──────────────────────
      if (!isLocked && dto.rules !== undefined) {
        await queryRunner.query(
          `DELETE FROM MaGiamGiaDieuKien WHERE MaCoupon = ?`,
          [couponId],
        );

        const normalizedRules: Array<{
          loaiDieuKien: AdminCouponRuleType;
          giaTriDieuKien: number | null;
          moTa: string | null;
        }> = Array.isArray(dto.rules)
          ? dto.rules.map((rule: AdminCouponRuleInput) => ({
              loaiDieuKien: rule.loaiDieuKien,
              giaTriDieuKien:
                rule.giaTriDieuKien === null ||
                rule.giaTriDieuKien === undefined
                  ? null
                  : Number(rule.giaTriDieuKien),
              moTa: rule.moTa?.trim() || null,
            }))
          : [];

        for (const rule of normalizedRules) {
          await queryRunner.query(
            `INSERT INTO MaGiamGiaDieuKien (MaCoupon, LoaiDieuKien, GiaTriDieuKien, MoTa) VALUES (?, ?, ?, ?)`,
            [couponId, rule.loaiDieuKien, rule.giaTriDieuKien, rule.moTa],
          );
        }
      }

      await queryRunner.commitTransaction();
      return { couponId, updated: true, isLocked };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Mã code này đã tồn tại, vui lòng dùng mã khác');
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateAdminCouponStatus(
    _adminId: number,
    couponId: number,
    status: string,
  ) {
    const result = await this.dataSource.query(
      `UPDATE MaGiamGia SET TrangThai = ? WHERE MaCoupon = ?`,
      [status, couponId],
    );
    if (!result.affectedRows) {
      throw new BadRequestException('Mã giảm giá không tồn tại');
    }
    return { couponId, status };
  }

  async deleteAdminCoupon(_adminId: number, couponId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const coupons = await queryRunner.query(
        `SELECT MaCoupon, SoLuongDaDung
         FROM MaGiamGia
         WHERE MaCoupon = ?
         LIMIT 1`,
        [couponId],
      );

      if (!coupons.length) {
        throw new NotFoundException('Mã giảm giá không tồn tại');
      }

      const coupon = coupons[0] as { MaCoupon: number; SoLuongDaDung: number };
      const usageCount = Number(
        (coupon as any).SoLuongDaDung ??
          (coupon as any).soLuongDaDung ??
          (coupon as any).soLuongdadung ??
          0,
      );

      if (usageCount > 0) {
        throw new BadRequestException(
          'Không thể xóa mã giảm giá đã có lượt sử dụng',
        );
      }

      await queryRunner.query(
        `DELETE FROM MaGiamGiaPhamVi WHERE MaCoupon = ?`,
        [couponId],
      );
      await queryRunner.query(
        `DELETE FROM MaGiamGiaDieuKien WHERE MaCoupon = ?`,
        [couponId],
      );
      await queryRunner.query(
        `DELETE FROM LichSuSuDungMaGiamGia WHERE MaCoupon = ?`,
        [couponId],
      );
      await queryRunner.query(`DELETE FROM MaGiamGia WHERE MaCoupon = ?`, [
        couponId,
      ]);

      await queryRunner.commitTransaction();

      return { couponId, deleted: true };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
