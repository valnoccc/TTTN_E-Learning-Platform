import axiosClient from './axios';
import { CourseDetailsData } from './checkout';

// ─── Cart API ──────────────────────────────────────────────────────────────

/** Lấy toàn bộ giỏ hàng từ backend */
export const fetchCart = async (): Promise<CourseDetailsData[]> => {
  const data: any = await axiosClient.get('/cart');
  return data ?? [];
};

/** Thêm một khóa học vào giỏ hàng trên backend */
export const addToCartAPI = async (courseId: number): Promise<void> => {
  await axiosClient.post('/cart/add', { courseId });
};

/** Xóa một khóa học khỏi giỏ hàng trên backend */
export const removeFromCartAPI = async (courseId: number): Promise<void> => {
  await axiosClient.delete(`/cart/remove/${courseId}`);
};

/** Xóa toàn bộ giỏ hàng trên backend */
export const clearCartAPI = async (): Promise<void> => {
  await axiosClient.delete('/cart/clear');
};

/**
 * Sync localStorage items lên backend (gọi một lần sau khi login).
 * courseIds: danh sách MaKH từ localStorage cũ.
 */
export const syncCartToServer = async (courseIds: number[]): Promise<void> => {
  if (!courseIds || courseIds.length === 0) return;
  await axiosClient.post('/cart/sync', { courseIds });
};

// ─── Wishlist API ──────────────────────────────────────────────────────────

/** Lấy toàn bộ wishlist từ backend */
export const fetchWishlist = async (): Promise<CourseDetailsData[]> => {
  const data: any = await axiosClient.get('/wishlist');
  return data ?? [];
};

/**
 * Toggle một khóa học trong wishlist.
 * Trả về { action: 'added' | 'removed', courseId }
 */
export const toggleWishlistAPI = async (
  courseId: number,
): Promise<{ action: 'added' | 'removed'; courseId: number }> => {
  const data: any = await axiosClient.post('/wishlist/toggle', { courseId });
  return data;
};

/** Xóa một khóa học khỏi wishlist trên backend */
export const removeFromWishlistAPI = async (courseId: number): Promise<void> => {
  await axiosClient.delete(`/wishlist/${courseId}`);
};

/**
 * Sync localStorage wishlist lên backend (gọi một lần sau khi login).
 * courseIds: danh sách MaKH từ localStorage cũ.
 */
export const syncWishlistToServer = async (courseIds: number[]): Promise<void> => {
  if (!courseIds || courseIds.length === 0) return;
  await axiosClient.post('/wishlist/sync', { courseIds });
};
