import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CourseDetailsData } from '../../api/checkout';

interface CartState {
  items: CourseDetailsData[];
  totalAmount: number;
}

const getUserIdentifier = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.maND || user.id || user.email || 'guest';
    }
  } catch (e) {}
  return 'guest';
};

const getCartKey = () => `cart_${getUserIdentifier()}`;

// Lấy giỏ hàng từ LocalStorage
const loadCartFromStorage = (): CartState => {
  try {
    const savedCart = localStorage.getItem(getCartKey());
    if (savedCart) {
      return JSON.parse(savedCart);
    }
  } catch (error) {
    console.error('Failed to parse cart from storage', error);
  }
  return { items: [], totalAmount: 0 };
};

const initialState: CartState = loadCartFromStorage();

// Hàm hỗ trợ lưu vào LocalStorage
const saveCartToStorage = (state: CartState) => {
  try {
    localStorage.setItem(getCartKey(), JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save cart to storage', error);
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CourseDetailsData>) {
      const exists = state.items.find((item) => item.id === action.payload.id);
      if (!exists) {
        state.items.push(action.payload);
        state.totalAmount += action.payload.price;
        saveCartToStorage(state);
      }
    },
    removeFromCart(state, action: PayloadAction<number>) {
      const index = state.items.findIndex((item) => item.id === action.payload);
      if (index !== -1) {
        state.totalAmount -= state.items[index].price;
        state.items.splice(index, 1);
        saveCartToStorage(state);
      }
    },
    clearCart(state) {
      state.items = [];
      state.totalAmount = 0;
      saveCartToStorage(state);
    },
    loadUserCart(state) {
      const newState = loadCartFromStorage();
      state.items = newState.items;
      state.totalAmount = newState.totalAmount;
    }
  },
});

export const { addToCart, removeFromCart, clearCart, loadUserCart } = cartSlice.actions;
export default cartSlice.reducer;
