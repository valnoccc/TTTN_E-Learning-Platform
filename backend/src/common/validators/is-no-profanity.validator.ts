import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BAD_WORD_PATTERNS } from '../constants/bad-words.constant';

/**
 * Kiểm tra một chuỗi văn bản có chứa từ ngữ vi phạm hay không.
 *
 * Thuật toán: duyệt tuyến tính qua danh sách RegExp đã biên dịch sẵn.
 * Dừng sớm (short-circuit) ngay khi tìm thấy từ đầu tiên vi phạm → O(k)
 * trong trường hợp trung bình với k = vị trí từ vi phạm đầu tiên.
 *
 * @param text Nội dung cần kiểm tra.
 * @returns `true` nếu nội dung SẠCH, `false` nếu vi phạm.
 */
export function isCleanText(text: string): boolean {
  if (!text || text.trim().length === 0) return true;
  return !BAD_WORD_PATTERNS.some((pattern) => pattern.test(text));
}

// ─────────────────────────────────────────────────────────────────────────────
// class-validator constraint
// ─────────────────────────────────────────────────────────────────────────────

@ValidatorConstraint({ name: 'IsNoProfanity', async: false })
export class IsNoProfanityConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, _args: ValidationArguments): boolean {
    if (typeof value !== 'string') return true; // để validator khác (@IsString) xử lý
    return isCleanText(value);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Nội dung chứa từ khóa vi phạm tiêu chuẩn cộng đồng';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom decorator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @IsNoProfanity()
 *
 * Gắn vào bất kỳ trường `string` nào trong DTO để chặn nội dung vi phạm.
 * Khi validate thất bại, NestJS sẽ tự động trả về HTTP 400 Bad Request.
 *
 * @example
 * ```ts
 * @IsNoProfanity()
 * noiDung: string;
 * ```
 */
export function IsNoProfanity(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNoProfanityConstraint,
    });
  };
}
