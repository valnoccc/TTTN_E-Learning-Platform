import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Trash2, Heart, ShoppingCart, Loader2 } from 'lucide-react';
import { AppDispatch, RootState } from '../../../../store/store';
import {
  toggleWishlist,
  removeFromWishlist,
  loadWishlistFromServer,
  toggleWishlistThunk,
  removeFromWishlistThunk,
} from '../../../wishlist/wishlistSlice';
import { addToCart, addToCartThunk } from '../../../cart/cartSlice';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';

export default function Wishlist() {
  const dispatch = useDispatch<AppDispatch>();
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const loading = useSelector((state: RootState) => state.wishlist.loading);
  const isSynced = useSelector((state: RootState) => state.wishlist.synced);
  const cartSynced = useSelector((state: RootState) => state.cart.synced);

  const isLoggedIn = !!localStorage.getItem('access_token');

  // Khi mount: fetch wishlist từ backend nếu đã đăng nhập
  useEffect(() => {
    if (isLoggedIn && !isSynced) {
      dispatch(loadWishlistFromServer());
    }
  }, [dispatch, isLoggedIn, isSynced]);

  const handleRemove = (item: any) => {
    // Optimistic UI
    dispatch(removeFromWishlist(item.id));

    if (isLoggedIn && isSynced) {
      dispatch(removeFromWishlistThunk(item.id))
        .unwrap()
        .catch(() => {
          toast.error('Không thể gỡ khỏi danh sách yêu thích. Vui lòng thử lại.');
        });
    } else {
      dispatch(toggleWishlist(item));
    }
    toast.success(`Đã gỡ "${item.courseName}" khỏi danh sách yêu thích!`);
  };

  const handleAddToCart = (item: any) => {
    // Optimistic: thêm vào cart Redux
    dispatch(addToCart(item));

    if (isLoggedIn && cartSynced) {
      dispatch(addToCartThunk(item))
        .unwrap()
        .catch(() => {
          toast.error('Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
        });
    }
    toast.success(`Đã thêm "${item.courseName}" vào giỏ hàng!`);
  };

  return (
    <div className="cart-page bg-slate-50 min-h-screen pb-16">
      <BreadcrumbBox title="Wishlist" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col gap-8">

          <div className="w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <Loader2 size={40} className="animate-spin text-emerald-500 mb-3" />
                  <p className="text-slate-500">Đang tải danh sách yêu thích...</p>
                </div>
              ) : wishlistItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                        <th className="p-4 font-semibold">Khóa học</th>
                        <th className="p-4 font-semibold">Giá</th>
                        <th className="p-4 font-semibold text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {wishlistItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={item.thumbnail}
                                alt={item.courseName}
                                className="w-20 h-14 object-cover rounded-lg shadow-sm"
                              />
                              <div>
                                <Link
                                  to={`/course-details/${item.id}`}
                                  className="font-semibold text-slate-800 hover:text-emerald-600 transition-colors line-clamp-2"
                                >
                                  {item.courseName}
                                </Link>
                                <p className="text-sm text-slate-500 mt-1">{item.instructor}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-medium text-slate-700">
                            {item.price.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors"
                                title="Thêm vào giỏ hàng"
                              >
                                <ShoppingCart size={20} />
                              </button>
                              <button
                                onClick={() => handleRemove(item)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="Gỡ khỏi danh sách"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                    <Heart size={40} className="text-rose-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Danh sách yêu thích trống</h3>
                  <p className="text-slate-500 mb-6">Bạn chưa lưu khóa học nào vào danh sách yêu thích.</p>
                  <Link
                    to="/course-grid"
                    className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl shadow-sm hover:bg-emerald-700 hover:-translate-y-0.5 transition-all"
                  >
                    Khám phá khóa học
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
