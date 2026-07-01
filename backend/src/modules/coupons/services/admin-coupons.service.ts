import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateAdminCouponDto, type AdminCouponRuleInput, type AdminCouponRuleType, type AdminCouponScopeType } from '../dto/create-admin-coupon.dto';
import { CouponsService } from './coupons.service';
import { Coupon } from '../entities/coupon.entity';
import { KhoaHoc } from '../../courses/entities/course.entity';

@Injectable()
export class AdminCouponsService extends CouponsService {
  constructor(
    @InjectRepository(Coupon)
    couponRepository: any,
    @InjectRepository(KhoaHoc)
    courseRepository: any,
    dataSource: DataSource,
  ) {
    super(couponRepository, courseRepository, dataSource);
  }

  async createAdminCoupon(adminId: number, payload: CreateAdminCouponDto) {
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

  async updateAdminCouponStatus(
    adminId: number,
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

  async deleteAdminCoupon(adminId: number, couponId: number) {
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

      await queryRunner.query(`DELETE FROM MaGiamGiaPhamVi WHERE MaCoupon = ?`, [
        couponId,
      ]);
      await queryRunner.query(`DELETE FROM MaGiamGiaDieuKien WHERE MaCoupon = ?`, [
        couponId,
      ]);
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
