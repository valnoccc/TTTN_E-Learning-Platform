import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Trash2, ShoppingBag } from 'lucide-react';
import { RootState } from '../../../../store/store';
import { removeFromCart } from '../../../cart/cartSlice';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';

export default function Cart() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalAmount = useSelector((state: RootState) => state.cart.totalAmount);

  const handleRemove = (id: number, name: string) => {
    dispatch(removeFromCart(id));
    toast.success(`${t('Remove item')} ${name} ${t('Success')}`);
  };

  return (
    <div className="cart-page bg-slate-50 min-h-screen pb-16">
      <BreadcrumbBox title={t('Cart')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Cart Items Table */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {cartItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                        <th className="p-4 font-semibold">{t('Product')}</th>
                        <th className="p-4 font-semibold">{t('Price')}</th>
                        <th className="p-4 font-semibold text-center">{t('Action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cartItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-4">
                              <img 
                                src={item.thumbnail} 
                                alt={item.courseName} 
                                className="w-20 h-14 object-cover rounded-lg shadow-sm"
                              />
                              <div>
                                <Link to={`/course-details/${item.id}`} className="font-semibold text-slate-800 hover:text-emerald-600 transition-colors line-clamp-2">
                                  {item.courseName}
                                </Link>
                                <p className="text-sm text-slate-500 mt-1">{item.instructor}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-medium text-slate-700">
                            ${item.price.toFixed(2)}
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
                  <Link to="/course-grid" className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl shadow-sm hover:bg-emerald-700 hover:-translate-y-0.5 transition-all">
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
                  <span>{t('Subtotal')}</span>
                  <span className="font-medium">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>VAT (0%)</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-800">{t('Grand Total')}</span>
                  <span className="text-2xl font-bold text-emerald-600">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button 
                className="w-full py-3.5 bg-slate-900 text-white font-semibold rounded-xl shadow-md hover:bg-emerald-600 hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:bg-slate-900 disabled:cursor-not-allowed"
                disabled={cartItems.length === 0}
              >
                {t('Proceed to checkout')}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}