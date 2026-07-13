import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CourseDetailsData } from '../../api/checkout';
import {
  fetchWishlist,
  toggleWishlistAPI,
  removeFromWishlistAPI,
  syncWishlistToServer,
} from '../../api/cartWishlist';

interface WishlistState {
  items: CourseDetailsData[];
  loading: boolean;
  synced: boolean;
}

const calcIds = (items: CourseDetailsData[]): number[] => items.map((i) => i.id);

// ─── Thunk: load wishlist từ backend và merge localStorage cũ ─────────────
export const loadWishlistFromServer = createAsyncThunk(
  'wishlist/loadFromServer',
  async (_, { getState }) => {
    const state = getState() as { wishlist: WishlistState };

    // 1. Lấy data backend
    const serverItems = await fetchWishlist();

    // 2. Nếu có data cũ trong localStorage và chưa sync → sync lên server
    if (!state.wishlist.synced && state.wishlist.items.length > 0) {
      const localIds = calcIds(state.wishlist.items);
      const serverIds = calcIds(serverItems);
      const newIds = localIds.filter((id) => !serverIds.includes(id));
      if (newIds.length > 0) {
        await syncWishlistToServer(newIds);
        const merged = await fetchWishlist();
        return merged;
      }
    }

    return serverItems;
  },
);

// ─── Thunk: toggle wishlist (optimistic) ─────────────────────────────────
export const toggleWishlistThunk = createAsyncThunk(
  'wishlist/toggle',
  async (item: CourseDetailsData) => {
    const result = await toggleWishlistAPI(item.id);
    return { item, action: result.action };
  },
);

// ─── Thunk: xóa khỏi wishlist ─────────────────────────────────────────────
export const removeFromWishlistThunk = createAsyncThunk(
  'wishlist/remove',
  async (courseId: number) => {
    await removeFromWishlistAPI(courseId);
    return courseId;
  },
);

// ─── Slice ──────────────────────────────────────────────────────────────────

const loadLocalWishlist = (): WishlistState => {
  try {
    const saved = localStorage.getItem('wishlist');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        items: parsed.items ?? [],
        loading: false,
        synced: false,
      };
    }
  } catch {}
  return { items: [], loading: false, synced: false };
};

const initialState: WishlistState = loadLocalWishlist();

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    // Action đồng bộ (dùng khi user chưa login)
    toggleWishlist(state, action: PayloadAction<CourseDetailsData>) {
      const idx = state.items.findIndex((i) => i.id === action.payload.id);
      if (idx !== -1) {
        state.items.splice(idx, 1);
      } else {
        state.items.push(action.payload);
      }
      const isLoggedIn = !!localStorage.getItem('access_token');
      if (!isLoggedIn) {
        localStorage.setItem('wishlist', JSON.stringify({ items: state.items }));
      }
    },
    removeFromWishlist(state, action: PayloadAction<number>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
      const isLoggedIn = !!localStorage.getItem('access_token');
      if (!isLoggedIn) {
        localStorage.setItem('wishlist', JSON.stringify({ items: state.items }));
      }
    },
    clearWishlist(state) {
      state.items = [];
      localStorage.removeItem('wishlist');
    },
  },
  extraReducers: (builder) => {
    // loadWishlistFromServer
    builder.addCase(loadWishlistFromServer.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadWishlistFromServer.fulfilled, (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.synced = true;
      localStorage.removeItem('wishlist');
    });
    builder.addCase(loadWishlistFromServer.rejected, (state) => {
      state.loading = false;
    });

    // toggleWishlistThunk
    builder.addCase(toggleWishlistThunk.fulfilled, (state, action) => {
      const { item, action: act } = action.payload;
      if (act === 'added') {
        if (!state.items.find((i) => i.id === item.id)) {
          state.items.push(item);
        }
      } else {
        state.items = state.items.filter((i) => i.id !== item.id);
      }
    });

    // removeFromWishlistThunk
    builder.addCase(removeFromWishlistThunk.fulfilled, (state, action) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
    });
  },
});

export const { toggleWishlist, removeFromWishlist, clearWishlist } =
  wishlistSlice.actions;
export default wishlistSlice.reducer;
