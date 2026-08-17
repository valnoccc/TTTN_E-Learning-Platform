/**
 * @file profanity.util.ts
 * @description Tiện ích lọc từ ngữ tục tĩu phía client (tiếng Việt).
 *
 * Danh sách pattern được biên dịch một lần khi module load (IIFE) để tái sử
 * dụng hiệu quả, tránh khởi tạo RegExp mỗi lần gọi hàm.
 *
 * Thuật toán: Array.prototype.some() – duyệt tuần tự và dừng sớm
 * (short-circuit) ngay khi tìm thấy từ vi phạm đầu tiên.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tạo RegExp cho pattern, tự động chèn ký tự "nhiễu" (khoảng cách, dấu gạch,
 * ký tự đặc biệt) giữa mỗi ký tự để bắt cách viết lách luật.
 */
function w(pattern: string): RegExp {
  const spaced = pattern.split('').join('[\\s\\-_.@*|#]*');
  return new RegExp(spaced, 'i');
}

// ─────────────────────────────────────────────────────────────────────────────
// Danh sách từ vi phạm – biên dịch một lần (module-level constant)
// ─────────────────────────────────────────────────────────────────────────────
const BAD_WORD_PATTERNS: readonly RegExp[] = Object.freeze([
  w('vl'),
  w('vc'),
  w('vch'),
  w('vãi'),
  w('đái'),
  w('bắc kì'),
  w('bắc kỳ'),
  w('backi'),
  w('chó'),
  w('đụ'),
  w('đéo'),
  w('đcm'),
  w('đmm'),
  w('đm'),
  w('đmcs'),
  w('dm'),
  w('clm'),
  w('cặc'),
  w('buồi'),
  w('lồn'),
  w('đít'),
  w('địt'),
  w('dit'),
  w('fuck'),
  w('fuk'),
  w('fck'),
  w('shit'),
  w('bitch'),
  w('asshole'),
  w('bastard'),
  w('thằng chó'),
  w('con chó'),
  w('chó chết'),
  w('súc vật'),
  w('óc chó'),
  w('mặt lồn'),
  w('đầu buồi'),
  w('vô học'),
  w('cút'),
  w('ngu'),
  w('đồ ngu'),
  w('thằng ngu'),
  w('con ngu'),
  w('óc lợn'),
  w('đần'),
  w('khốn nạn'),
  w('khốn kiếp'),
  w('đồ chó'),
  w('mẹ mày'),
  w('bố mày'),
  /đ[u\*@]+/i,
  /đ[ụ\*].*mẹ/i,
  /l[o0][^\w]*[ln]/i,
  /c[aă][^\w]*[ck]/i,
  /bu[o0][^\w]*i/i,
  /f[u\*][^\w]*[ck]/i,
]);

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kiểm tra xem văn bản có chứa từ ngữ vi phạm hay không.
 *
 * @param text Nội dung cần kiểm tra.
 * @returns `true` nếu phát hiện từ vi phạm, `false` nếu nội dung sạch.
 *
 * @example
 * ```ts
 * if (checkProfanity(reviewContent)) {
 *   toast.error('Đánh giá của bạn chứa từ ngữ không phù hợp.');
 *   return;
 * }
 * ```
 */
export function checkProfanity(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  return BAD_WORD_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Trả về danh sách các đoạn văn bản vi phạm tìm được.
 * Hữu ích khi debug hoặc log ở môi trường development.
 */
export function findViolations(text: string): string[] {
  if (!text || text.trim().length === 0) return [];
  return BAD_WORD_PATTERNS.filter((p) => p.test(text)).map((p) => p.toString());
}
