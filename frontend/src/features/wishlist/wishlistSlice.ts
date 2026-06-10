import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CourseDetailsData } from '../../api/checkout'; // using the same data interface for now

interface WishlistState {
  items: CourseDetailsData[];
}

const loadWishlistFromStorage = (): WishlistState => {
  try {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      return JSON.parse(savedWishlist);
    }
  } catch (error) {
    console.error('Failed to parse wishlist from storage', error);
  }
  return { items: [] };
};

const initialState: WishlistState = loadWishlistFromStorage();

const saveWishlistToStorage = (state: WishlistState) => {
  try {
    localStorage.setItem('wishlist', JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save wishlist to storage', error);
  }
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    toggleWishlist(state, action: PayloadAction<CourseDetailsData>) {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        // Remove if it exists
        state.items.splice(index, 1);
      } else {
        // Add if it doesn't exist
        state.items.push(action.payload);
      }
      saveWishlistToStorage(state);
    },
    removeFromWishlist(state, action: PayloadAction<number>) {
      const index = state.items.findIndex((item) => item.id === action.payload);
      if (index !== -1) {
        state.items.splice(index, 1);
        saveWishlistToStorage(state);
      }
    },
    clearWishlist(state) {
      state.items = [];
      saveWishlistToStorage(state);
    },
  },
});

export const { toggleWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
