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
      className="nav-link bg-transparent border-0 p-0 position-relative d-flex align-items-center justify-content-center"
      style={{ color: '#11B67A', transition: 'color 0.2s' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#0e9f6a')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '#11B67A')}
    >
      <i className="las la-shopping-cart" style={{ fontSize: '20px' }}></i>
      {cartItems.length > 0 && (
        <span
          className="position-absolute translate-middle badge rounded-pill bg-danger"
          style={{ top: '6px', right: '-8px', fontSize: '10px' }}
        >
          {cartItems.length}
        </span>
      )}
    </button>
  );
}
