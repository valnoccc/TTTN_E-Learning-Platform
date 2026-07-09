import { useState, useEffect } from 'react';
import { Dropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, User, Heart, BookOpen } from 'lucide-react';
import { normalizeRole } from '../../../../utils/roles';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../store/store';
import { loadUserCart, loadCartFromServer } from '../../../cart/cartSlice';
import { loadWishlistFromServer } from '../../../wishlist/wishlistSlice';

type StoredUser = {
  fullName?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  avatar?: string;
  photoUrl?: string;
  imageUrl?: string;
  vaiTro?: string;
  role?: string;
};

function getDashboardPath(vaiTro?: string) {
  const normalizedRole = normalizeRole(vaiTro);
  if (normalizedRole === 'ADMIN') return '/admin';
  if (normalizedRole === 'INSTRUCTOR') return '/instructor';
  return '/student/profile';
}

function getDisplayName(user: StoredUser | null) {
  const rawName = user?.fullName || user?.name || user?.email || 'User';
  return rawName.split(' ').filter(Boolean).pop() || 'User';
}

function getAvatarUrl(user: StoredUser | null) {
  return user?.avatarUrl || user?.avatar || user?.photoUrl || user?.imageUrl || '';
}

export default function AuthControls() {
  const [user, setUser] = useState<StoredUser | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const wishlistItems = useSelector((state: RootState) => state.wishlist?.items || []);
  const dispatch = useDispatch();

  useEffect(() => {
    const handleAuthChange = () => {
      const userString = localStorage.getItem('user');
      if (userString) {
        try {
          const parsedUser = JSON.parse(userString) as StoredUser;
          setUser({ ...parsedUser, role: normalizeRole(parsedUser.role || parsedUser.vaiTro), vaiTro: normalizeRole(parsedUser.role || parsedUser.vaiTro) });
        } catch (error) {
          console.error('Lỗi khi parse user từ localStorage:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      // Nạp lại giỏ hàng tương ứng với user hiện tại hoặc guest
      if (userString) {
        dispatch(loadCartFromServer() as any);
        dispatch(loadWishlistFromServer() as any);
      } else {
        dispatch(loadUserCart());
      }
    };

    // Chạy mỗi khi chuyển trang (ví dụ từ /login sang /)
    handleAuthChange();

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [location, dispatch]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  };

  if (!user) {
    return (
      <div className="d-flex align-items-center justify-content-end gap-3" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Nút Đăng nhập - Thẳng hàng, mượt mà */}
        <button 
          onClick={() => navigate('/login')}
          className="btn d-flex align-items-center p-0 text-dark border-0 backend-login-btn"
          style={{ background: 'none', cursor: 'pointer', gap: '8px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
        >
          <div className="icon-wrapper d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#eefbf4' }}>
            <i className="las la-user text-success" style={{ fontSize: '18px', color: '#28a745' }}></i>
          </div>
          <span style={{ fontWeight: '500', fontSize: '15px' }}>Đăng nhập</span>
        </button>

        {/* Nút Đăng ký - Dạng hình Oval dài chuẩn UI Shopee/Udemy */}
        <button 
          onClick={() => navigate('/register')}
          className="btn btn-success text-white px-4 py-2"
          style={{ 
            backgroundColor: '#28a745', 
            border: 'none',
            borderRadius: '50px', 
            fontWeight: '500', 
            fontSize: '14px', 
            whiteSpace: 'nowrap', 
            padding: '8px 20px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
        >
          Đăng ký
        </button>

      </div>
    );
  }

  const avatarUrl = getAvatarUrl(user);
  const displayName = getDisplayName(user);

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        as="button"
        bsPrefix="custom-dropdown-toggle"
        className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-gradient-to-b from-white to-slate-50 px-2.5 py-1.5 text-[13px] font-semibold text-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:no-underline after:hidden"
        aria-label="Account menu"
      >
        <span className="flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-full bg-sky-100 ring-1 ring-sky-200/70">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[13px] font-bold text-slate-900">{displayName.charAt(0).toUpperCase()}</span>
          )}
        </span>
        <span className="max-w-[110px] truncate">{displayName}</span>
        <ChevronDown size={14} className="text-slate-500" />
      </Dropdown.Toggle>

      <Dropdown.Menu className="mt-3 min-w-[190px] rounded-[14px] border border-slate-100 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
        <Dropdown.Item
          as={Link}
          to={getDashboardPath(user.vaiTro)}
          className="rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 flex items-center"
        >
          <User size={14} className="me-2" />
          Bảng điều khiển
        </Dropdown.Item>
        <Dropdown.Item
          as={Link}
          to="/student/profile?tab=courses"
          className="rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 flex items-center"
        >
          <BookOpen size={14} className="me-2 text-emerald-500" />
          Khóa học của tôi
        </Dropdown.Item>
        <Dropdown.Item
          as={Link}
          to="/student/wishlist"
          className="rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
        >
          <div className="flex items-center">
            <Heart size={14} className="me-2 text-rose-500" />
            Yêu thích
          </div>
          {wishlistItems.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
              {wishlistItems.length}
            </span>
          )}
        </Dropdown.Item>
        <Dropdown.Divider className="my-1" />
        <Dropdown.Item
          as="button"
          onClick={handleLogout}
          className="rounded-xl px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 flex items-center"
        >
          <LogOut size={14} className="me-2" />
          Đăng xuất
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
