import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  BarChart3,
  ChevronUp,
  GraduationCap,
  CalendarDays,
  MessageSquare,
  Star,
  Receipt,
  House,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import UserDropdown from "../instructor/UserDropdown";
import axiosClient from "../../api/axios";
import { useInstructorAttentionSummary } from "../../features/instructor-attention/hooks/useInstructorAttentionSummary";

type SidebarItem = {
  label: string;
  path: string;
  icon: ReactNode;
  match?: "exact" | "prefix";
  badge?: number;
};

type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

export default function InstructorSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null"),
  );
  const [avatarError, setAvatarError] = useState(false);
  const attentionSummary = useInstructorAttentionSummary();

  useEffect(() => {
    const syncProfileWithDB = async () => {
      try {
        const response = await axiosClient.get<any>("/instructors/me/profile");
        const profileData = response.data || response;

        if (profileData && user) {
          if (
            profileData.hoTen !== user.fullName ||
            profileData.anhDaiDien !== user.avatar
          ) {
            const updatedUser = {
              ...user,
              fullName: profileData.hoTen || user.fullName,
              avatar: profileData.anhDaiDien || user.avatar,
              AnhDaiDien: profileData.anhDaiDien || user.AnhDaiDien,
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
          }
        }
      } catch (error) {
        console.error("Không thể đồng bộ thông tin sidebar từ DB:", error);
      }
    };

    void syncProfileWithDB();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sections: SidebarSection[] = [
    {
      title: "Tổng quan",
      items: [
        {
          label: "Báo cáo & Thống kê",
          path: "/instructor/reports",
          icon: <BarChart3 size={18} />,
          match: "exact",
        },
      ],
    },
    {
      title: "Quản lý khóa học",
      items: [
        {
          label: "Quản lý thông tin khóa học",
          path: "/instructor/courses",
          icon: <BookOpen size={18} />,
          match: "prefix",
        },
      ],
    },
    {
      title: "Tài chính",
      items: [
        {
          label: "Báo cáo doanh thu",
          path: "/instructor/reports/monthly-revenue",
          icon: <CalendarDays size={18} />,
          match: "exact",
        },
        {
          label: "Giao dịch mới",
          path: "/instructor/transactions",
          icon: <Receipt size={18} />,
          match: "exact",
        },
      ],
    },
    {
      title: "Tương tác",
      items: [
        {
          label: "Hỏi đáp",
          path: "/instructor/discussions",
          icon: <MessageSquare size={18} />,
          match: "exact",
          badge: attentionSummary.unansweredQuestions,
        },
        {
          label: "Đánh giá khóa học",
          path: "/instructor/reviews",
          icon: <Star size={18} />,
          match: "exact",
          badge: attentionSummary.unrespondedReviews,
        },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  return (
    <aside className="sticky top-0 self-start flex h-screen w-[260px] shrink-0 flex-col overflow-hidden border-r border-[#1f3348] bg-[#112132] text-white">
      <div className="flex h-[60px] items-center justify-center border-b border-white/10 px-5">
        <div className="flex items-center gap-2 text-[1.2rem] font-bold tracking-tight text-[#1dbf73]">
          <GraduationCap size={20} />
          <span>EDUMEO</span>
        </div>
      </div>

      <div className="border-b border-white/10 px-3 py-3">
        <Link
          to="/"
          title="Về trang chủ"
          className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 text-[14px] font-semibold text-[#d0d6e2] transition hover:border-[#1dbf73]/50 hover:bg-[#1a324b] hover:text-white"
        >
          <House size={18} className="text-[#1dbf73]" />
          <span>Về trang chủ</span>
        </Link>
      </div>

      <nav className="scrollbar-none min-h-0 flex-1 overflow-y-auto py-3">
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => (
            <section
              key={section.title}
              className={sectionIndex > 0 ? "pt-1" : ""}
            >
              <div className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f8198]">
                {section.title}
              </div>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    item.match === "prefix"
                      ? location.pathname === item.path ||
                        location.pathname.startsWith(`${item.path}/`)
                      : location.pathname === item.path;

                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-4 border-l-4 px-5 py-4 text-[14px] transition ${
                          isActive
                            ? "border-l-[#1dbf73] bg-[#1a324b] font-bold text-white"
                            : "border-l-transparent text-[#d0d6e2] hover:bg-[#1a324b] hover:text-white"
                        }`}
                      >
                        <span
                          className={isActive ? "text-white" : "text-[#a0aec0]"}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                        {item.badge && item.badge > 0 ? (
                          <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white">
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="relative mt-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu((value) => !value)}
            className={`flex w-full items-center justify-between border px-3 py-2 transition ${
              showUserMenu
                ? "border-[#aeb8c6] bg-[#1a324b]"
                : "border-white/10 bg-[#112132] hover:bg-[#1a324b]"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-[2px] bg-[#1dbf73] text-[14px] font-bold text-white">
                {user?.avatar && user.avatar !== 'null' && user.avatar !== 'undefined' && !avatarError ? (
                  <img
                    src={user.avatar.startsWith('http') || user.avatar.startsWith('data:') ? user.avatar : `/assets/images/${user.avatar.startsWith('/') ? user.avatar.substring(1) : user.avatar}`}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  (user?.fullName || "A").charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 text-left">
                <div className="truncate text-[14px] font-bold text-white">
                  {user?.fullName || "Unknown"}
                </div>
                <div className="text-[12px] text-[#a0aec0]">
                  {user?.role || "Giảng viên"}
                </div>
              </div>
            </div>
            <ChevronUp
              size={16}
              className={`text-[#a0aec0] transition-transform ${
                showUserMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {showUserMenu ? (
            <UserDropdown onLogout={handleLogout} user={user} />
          ) : null}
        </div>
      </div>
    </aside>
  );
}
