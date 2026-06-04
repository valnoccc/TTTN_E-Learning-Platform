import { Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { normalizeRole } from '../../../../utils/roles';

type StoredUser = {
  fullName?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  avatar?: string;
  photoUrl?: string;
  imageUrl?: string;
  role?: string;
};

function getDashboardPath(role?: string) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'ADMIN') return '/admin';
  if (normalizedRole === 'INSTRUCTOR') return '/instructor';
  return '/student';
}

function getDisplayName(user: StoredUser | null) {
  const rawName = user?.fullName || user?.name || user?.email || 'User';
  return rawName.split(' ').filter(Boolean).pop() || 'User';
}

function getAvatarUrl(user: StoredUser | null) {
  return user?.avatarUrl || user?.avatar || user?.photoUrl || user?.imageUrl || '';
}

export default function AuthControls() {
  const navigate = useNavigate();
  const userString = localStorage.getItem('user');
  let user: StoredUser | null = null;

  if (userString) {
    try {
      const parsedUser = JSON.parse(userString) as StoredUser;
      user = { ...parsedUser, role: normalizeRole(parsedUser.role) };
    } catch {
      user = null;
    }
  }
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) {
    return (
      <div className="flex items-center whitespace-nowrap">
        <Link
          to="/login"
          className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-900 shadow-[0_6px_16px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:no-underline"
        >
          Login
        </Link>
        <span className="mx-2 text-[13px] font-medium text-slate-400">/</span>
        <Link
          to="/register"
          className="inline-flex h-9 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-4 text-[13px] font-semibold text-white shadow-[0_10px_20px_rgba(22,163,74,0.22)] transition duration-200 hover:-translate-y-0.5 hover:from-emerald-600 hover:to-green-700 hover:text-white hover:no-underline"
        >
          Register
        </Link>
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(user);
  const displayName = getDisplayName(user);

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        as="button"
        className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-gradient-to-b from-white to-slate-50 px-2.5 py-1.5 text-[13px] font-semibold text-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:no-underline"
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
          to={getDashboardPath(user.role)}
          className="rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
        >
          <User size={14} className="me-2" />
          Dashboard
        </Dropdown.Item>
        <Dropdown.Divider className="my-1" />
        <Dropdown.Item
          as="button"
          onClick={handleLogout}
          className="rounded-xl px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut size={14} className="me-2" />
          Logout
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
