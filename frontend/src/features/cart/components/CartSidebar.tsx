import React from 'react';
import { Offcanvas, Button } from 'react-bootstrap';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import {
  removeFromCart,
  clearCart,
  removeFromCartThunk,
  clearCartThunk,
} from '../cartSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface CartSidebarProps {
  show: boolean;
  handleClose: () => void;
}

export default function CartSidebar({ show, handleClose }: CartSidebarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalAmount = useSelector((state: RootState) => state.cart.totalAmount);
  const isSynced = useSelector((state: RootState) => state.cart.synced);

  const isLoggedIn = !!localStorage.getItem('access_token');

  const handleRemove = (id: number, name: string) => {
    if (isLoggedIn && isSynced) {
      // Optimistic: xóa Redux ngay, gọi API ngầm
      dispatch(removeFromCart(id));
      dispatch(removeFromCartThunk(id))
        .unwrap()
        .catch(() => {
          toast.error('Không thể xóa khỏi giỏ hàng. Vui lòng thử lại.');
        });
    } else {
      dispatch(removeFromCart(id));
    }
    toast.success(`Đã xóa "${name}" khỏi giỏ hàng`);
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      toast.error('Vui lòng đăng nhập để tiếp tục thanh toán.');
      handleClose();
      navigate('/login');
      return;
    }

    handleClose();
    if (cartItems.length === 1) {
      navigate(`/checkout/${cartItems[0].id}`);
    } else if (cartItems.length > 1) {
      navigate('/student/cart');
    }
  };

  return (
    <Offcanvas show={show} onHide={handleClose} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title className="d-flex align-items-center gap-2">
          <ShoppingCart size={24} />
          Giỏ hàng ({cartItems.length})
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="d-flex flex-column">
        {cartItems.length === 0 ? (
          <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-muted">
            <ShoppingCart size={48} className="mb-3 opacity-50" />
            <p>Giỏ hàng của bạn đang trống.</p>
            <Button variant="outline-primary" onClick={handleClose}>
              Tiếp tục mua sắm
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-grow-1 overflow-auto pe-2">
              {cartItems.map((item) => (
                <div key={item.id} className="d-flex gap-3 mb-3 pb-3 border-bottom position-relative">
                  <img
                    src={item.thumbnail}
                    alt={item.courseName}
                    style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <div className="flex-grow-1">
                    <h6 className="mb-1" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                      {item.courseName}
                    </h6>
                    <p className="mb-0 text-success fw-bold">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                    </p>
                  </div>
                  <button
                    className="btn btn-link text-danger p-0 position-absolute"
                    style={{ top: 0, right: 0 }}
                    onClick={() => handleRemove(item.id, item.courseName)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-top pt-3 mt-3">
              <div className="d-flex justify-content-between mb-3">
                <span className="fw-bold">Tổng cộng:</span>
                <span className="fw-bold text-success fs-5">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                </span>
              </div>
              <div className="d-grid gap-2">
                <Button variant="success" size="lg" onClick={handleCheckout}>
                  Thanh toán
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={() => {
                    if (isLoggedIn && isSynced) {
                      dispatch(clearCart());
                      dispatch(clearCartThunk());
                    } else {
                      dispatch(clearCart());
                    }
                    toast.success('Đã xóa toàn bộ giỏ hàng!');
                  }}
                >
                  Xóa giỏ hàng
                </Button>
              </div>
            </div>
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
