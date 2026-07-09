import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CourseDetailsData } from '../../api/checkout';
import {
  fetchCart,
  addToCartAPI,
  removeFromCartAPI,
  clearCartAPI,
  syncCartToServer,
} from '../../api/cartWishlist';

interface CartState {
  items: CourseDetailsData[];
  totalAmount: number;
  loading: boolean;
  synced: boolean; // true khi đã fetch từ backend ít nhất 1 lần
}

// ─── Helper: tổng tiền ────────────────────────────────────────────────────
const calcTotal = (items: CourseDetailsData[]): number =>
  items.reduce((sum, item) => sum + (item.price ?? 0), 0);

// ─── Thunk: load giỏ hàng từ backend và merge localStorage cũ ─────────────
export const loadCartFromServer = createAsyncThunk(
  'cart/loadFromServer',
  async (_, { getState }) => {
    const state = getState() as { cart: CartState };

    // 1. Lấy data backend
    const serverItems = await fetchCart();

    // 2. Nếu có dữ liệu cũ trong localStorage (chưa sync) → sync lên server
    if (!state.cart.synced && state.cart.items.length > 0) {
      const localIds = state.cart.items.map((i) => i.id);
      const serverIds = serverItems.map((i) => i.id);
      const newIds = localIds.filter((id) => !serverIds.includes(id));
      if (newIds.length > 0) {
        await syncCartToServer(newIds);
        // Fetch lại sau khi sync
        const merged = await fetchCart();
        return merged;
      }
    }

    return serverItems;
  },
);

// ─── Thunk: thêm khóa học vào giỏ (optimistic) ─────────────────────────────────────────────
export const addToCartThunk = createAsyncThunk(
  'cart/add',
  async (item: CourseDetailsData, { rejectWithValue }) => {
    try {
      console.log('[Cart] Calling addToCartAPI with courseId:', item.id);
      await addToCartAPI(item.id);
      console.log('[Cart] addToCartAPI success for courseId:', item.id);
      return item;
    } catch (error) {
      console.error('[Cart] addToCartAPI failed for courseId:', item.id, error);
      return rejectWithValue(error);
    }
  },
);

// ─── Thunk: xóa khóa học khỏi giỏ (optimistic) ─────────────────────────────
export const removeFromCartThunk = createAsyncThunk(
  'cart/remove',
  async (courseId: number) => {
    await removeFromCartAPI(courseId);
    return courseId;
  },
);

// ─── Thunk: xóa toàn bộ giỏ hàng ──────────────────────────────────────────
export const clearCartThunk = createAsyncThunk('cart/clear', async () => {
  await clearCartAPI();
});

// ─── Slice ──────────────────────────────────────────────────────────────────

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

const loadLocalCart = (): CartState => {
  try {
    const saved = localStorage.getItem(getCartKey());
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        items: parsed.items ?? [],
        totalAmount: parsed.totalAmount ?? 0,
        loading: false,
        synced: false,
      };
    }
  } catch {}
  return { items: [], totalAmount: 0, loading: false, synced: false };
};

const initialState: CartState = loadLocalCart();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Vẫn giữ action đồng bộ để dùng tạm khi user chưa login
    addToCart(state, action: PayloadAction<CourseDetailsData>) {
      if (!state.items.find((i) => i.id === action.payload.id)) {
        state.items.push(action.payload);
        state.totalAmount = calcTotal(state.items);
        const isLoggedIn = !!localStorage.getItem('access_token');
        if (!isLoggedIn) {
          localStorage.setItem(
            getCartKey(),
            JSON.stringify({ items: state.items, totalAmount: state.totalAmount }),
          );
        }
      }
    },
    removeFromCart(state, action: PayloadAction<number>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
      state.totalAmount = calcTotal(state.items);
      const isLoggedIn = !!localStorage.getItem('access_token');
      if (!isLoggedIn) {
        localStorage.setItem(
          getCartKey(),
          JSON.stringify({ items: state.items, totalAmount: state.totalAmount }),
        );
      }
    },
    clearCart(state) {
      state.items = [];
      state.totalAmount = 0;
      localStorage.removeItem(getCartKey());
    },
    loadUserCart(state) {
      const newState = loadLocalCart();
      state.items = newState.items;
      state.totalAmount = newState.totalAmount;
    },
  },
  extraReducers: (builder) => {
    // loadCartFromServer
    builder.addCase(loadCartFromServer.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadCartFromServer.fulfilled, (state, action) => {
      state.items = action.payload;
      state.totalAmount = calcTotal(action.payload);
      state.loading = false;
      state.synced = true;
      // Xóa localStorage cũ sau khi đã sync thành công
      localStorage.removeItem(getCartKey());
    });
    builder.addCase(loadCartFromServer.rejected, (state) => {
      state.loading = false;
    });

    // addToCartThunk (optimistic: đã add trước trong UI, thunk chỉ báo lỗi)
    builder.addCase(addToCartThunk.fulfilled, (state, action) => {
      if (!state.items.find((i) => i.id === action.payload.id)) {
        state.items.push(action.payload);
        state.totalAmount = calcTotal(state.items);
      }
    });
    // Nếu API thất bại → rollback item khỏi cart
    builder.addCase(addToCartThunk.rejected, (state, action) => {
      const item = action.meta.arg;
      state.items = state.items.filter((i) => i.id !== item.id);
      state.totalAmount = calcTotal(state.items);
      console.error('[Cart] addToCartThunk rejected - rolled back item', item.id);
    });

    // removeFromCartThunk
    builder.addCase(removeFromCartThunk.fulfilled, (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
      state.totalAmount = calcTotal(state.items);
    });

    // clearCartThunk
    builder.addCase(clearCartThunk.fulfilled, (state) => {
      state.items = [];
      state.totalAmount = 0;
    });
  },
});

export const { addToCart, removeFromCart, clearCart, loadUserCart } =
  cartSlice.actions;
export default cartSlice.reducer;
