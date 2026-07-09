import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { AppDispatch, RootState } from '../../../../store/store';
import {
  removeFromCart,
  clearCart,
  loadCartFromServer,
  removeFromCartThunk,
  clearCartThunk,
} from '../../../cart/cartSlice';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import { CouponModal } from '../../components/checkout/CouponModal';
import { VoucherTrigger } from '../../components/checkout/VoucherTrigger';

export default function Cart() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const loading = useSelector((state: RootState) => state.cart.loading);
  const isSynced = useSelector((state: RootState) => state.cart.synced);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [selectedCouponCode, setSelectedCouponCode] = useState<string>('');

  const isLoggedIn = !!localStorage.getItem('access_token');

  // Khi mount: nếu đã đăng nhập thì fetch giỏ hàng từ backend
  useEffect(() => {
    if (isLoggedIn && !isSynced) {
      dispatch(loadCartFromServer());
    }
  }, [dispatch, isLoggedIn, isSynced]);

  // Auto-select all items khi cartItems thay đổi
  useEffect(() => {
    setSelectedIds(cartItems.map((item) => item.id));
  }, [cartItems]);

  const handleRemove = (id: number, name: string) => {
    // Optimistic UI: xóa Redux trước
    dispatch(removeFromCart(id));
    setSelectedIds((prev) => prev.filter((sid) => sid !== id));

    if (isLoggedIn && isSynced) {
      dispatch(removeFromCartThunk(id))
        .unwrap()
        .catch(() => {
          toast.error('Không thể xóa khỏi giỏ hàng. Vui lòng thử lại.');
        });
    }
    toast.success(`${t('Remove item')} ${name} ${t('Success')}`);
  };

  const handleClearCart = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) {
      dispatch(clearCart());
      setSelectedIds([]);
      if (isLoggedIn && isSynced) {
        dispatch(clearCartThunk());
      }
      toast.success('Đã xóa toàn bộ giỏ hàng!');
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === cartItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cartItems.map((item) => item.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const selectedItems = cartItems.filter((item) => selectedIds.includes(item.id));
  const totalSelectedAmount = selectedItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="cart-page bg-slate-50 min-h-screen pb-16">
      <BreadcrumbBox title={t('Cart')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Cart Items Table */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <Loader2 size={40} className="animate-spin text-emerald-500 mb-3" />
                  <p className="text-slate-500">Đang tải giỏ hàng...</p>
                </div>
              ) : cartItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="flex justify-between items-center p-4 bg-white border-b border-slate-100">
                    <h3 className="font-semibold text-lg text-slate-800">Khóa học trong giỏ</h3>
                    <button
                      onClick={handleClearCart}
                      className="text-red-500 hover:text-red-600 flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} /> Xóa tất cả
                    </button>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                        <th className="p-4 w-12 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            checked={selectedIds.length === cartItems.length && cartItems.length > 0}
                            onChange={handleToggleSelectAll}
                          />
                        </th>
                        <th className="p-4 font-semibold">{t('Product')}</th>
                        <th className="p-4 font-semibold">{t('Price')}</th>
                        <th className="p-4 font-semibold text-center">{t('Action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cartItems.map((item) => (
                        <tr
                          key={item.id}
                          className={`transition-colors ${selectedIds.includes(item.id) ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => handleToggleSelect(item.id)}
                            />
                          </td>
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
                            <button
                              onClick={() => handleRemove(item.id, item.courseName)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              title={t('Remove item')}
                            >
                              <Trash2 size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag size={40} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Giỏ hàng trống</h3>
                  <p className="text-slate-500 mb-6">Bạn chưa có khóa học nào trong giỏ hàng.</p>
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

          {/* Cart Summary Box */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
              <h3 className="text-xl font-bold text-slate-800 mb-6">{t('Cart Summary')}</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-slate-600">
                  <span>Khóa học đã chọn</span>
                  <span className="font-medium">{selectedIds.length} khóa</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>{t('Subtotal')}</span>
                  <span className="font-medium">{totalSelectedAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>VAT (0%)</span>
                  <span className="font-medium">0 đ</span>
                </div>
                <div className="border-t border-slate-100 pt-4 pb-2">
                  <VoucherTrigger
                    couponCode={selectedCouponCode}
                    onClick={() => setShowCouponModal(true)}
                  />
                </div>
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-800">{t('Grand Total')}</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {totalSelectedAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <button
                className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl shadow-md hover:bg-emerald-600 hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:bg-slate-900 disabled:cursor-not-allowed"
                disabled={selectedIds.length === 0}
                onClick={() => {
                  if (selectedItems.length > 0) {
                    navigate('/checkout', {
                      state: {
                        selectedCourses: selectedItems,
                        appliedCouponCode: selectedCouponCode,
                      },
                    });
                  }
                }}
              >
                {t('Proceed to checkout')}
              </button>
            </div>
          </div>

          {/* Coupon Modal */}
          <CouponModal
            show={showCouponModal}
            onHide={() => setShowCouponModal(false)}
            courseIds={selectedIds}
            onSelectCoupon={(code) => setSelectedCouponCode(code)}
          />
        </div>
      </div>
    </div>
  );
}