import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../../store/store';

export default function CartIcon() {
  const navigate = useNavigate();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  const handleClick = () => navigate('/student/cart');

  return (
    <button
      onClick={handleClick}
      className="nav-link bg-transparent border-0 position-relative d-flex align-items-center justify-content-center"
      style={{ color: '#11B67A', transition: 'color 0.2s', padding: '5px 10px' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#0e9f6a')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '#11B67A')}
    >
      <i className="las la-shopping-cart" style={{ fontSize: '24px' }}></i>
      {cartItems.length > 0 && (
        <span
          className="position-absolute badge rounded-pill bg-danger text-white"
          style={{ fontSize: '11px', top: '0', right: '0' }}
        >
          {cartItems.length}
        </span>
      )}
    </button>
  );
}
