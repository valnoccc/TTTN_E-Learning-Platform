import React, { useEffect, useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../../hooks/useNotifications';

// A custom toggle to look like the bell icon
const CustomToggle = React.forwardRef<HTMLButtonElement, any>(
  ({ children, onClick }, ref) => (
    <button
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      className="nav-link bg-transparent border-0 position-relative d-flex align-items-center justify-content-center"
      style={{ color: '#11B67A', transition: 'color 0.2s', padding: '5px 10px' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = '#0e9f6a')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '#11B67A')}
    >
      {children}
    </button>
  )
);

CustomToggle.displayName = 'CustomToggle';

export const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);

  useEffect(() => {
    try {
      const crossSellData = localStorage.getItem('edumeo_cross_sell');
      if (crossSellData) {
        const parsed = JSON.parse(crossSellData);
        if (parsed.expiresAt && Date.now() < parsed.expiresAt && parsed.courses && Array.isArray(parsed.courses)) {
          setRecommendedCourses(parsed.courses);
        } else if (parsed.expiresAt && Date.now() >= parsed.expiresAt) {
          localStorage.removeItem('edumeo_cross_sell');
        }
      }
    } catch (e) {
      console.error('Failed to parse cross-sell data from localStorage', e);
    }
  }, [notifications]); // Re-check occasionally or when notifications change

  const totalItems = notifications.length + recommendedCourses.length;
  // Do not add recommendations to the unread badge count so it doesn't stay permanently high
  const displayUnreadCount = unreadCount;

  return (
    <Dropdown align="end">
      <Dropdown.Toggle as={CustomToggle} id="dropdown-notifications">
        <i className="las la-bell" style={{ fontSize: '24px' }}></i>
        {displayUnreadCount > 0 && (
          <span
            className="position-absolute badge rounded-pill bg-danger text-white"
            style={{ fontSize: '11px', top: '0', right: '0' }}
          >
            {displayUnreadCount}
          </span>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ width: '350px', maxHeight: '450px', overflowY: 'auto', padding: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom sticky-top bg-white" style={{ zIndex: 1 }}>
          <h6 className="m-0 font-weight-bold" style={{ color: '#333' }}>Thông báo</h6>
          {unreadCount > 0 && (
            <button 
              className="btn btn-sm btn-link text-decoration-none p-0" 
              style={{ fontSize: '13px', color: '#11B67A' }}
              onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
        
        {totalItems === 0 ? (
          <div className="p-4 text-center text-muted">
            <i className="las la-bell-slash mb-2" style={{ fontSize: '32px', color: '#ccc' }}></i>
            <p className="m-0" style={{ fontSize: '14px' }}>Không có thông báo nào</p>
          </div>
        ) : (
          <ul className="list-unstyled mb-0">
            {recommendedCourses.map(course => (
              <li 
                key={`rec-${course.maKH}`} 
                className="p-3 border-bottom bg-light"
                style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                onClick={() => {
                  navigate(`/course-details/${course.maKH}`);
                  // Note: clicking doesn't remove it from localstorage until it expires.
                  // But clicking navigation will redirect user.
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <strong style={{ fontSize: '14px', color: '#f59e0b', marginBottom: '4px' }}>
                    <i className="las la-star me-1"></i> Gợi ý cho bạn
                  </strong>
                </div>
                <div className="mt-1" style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                  {course.tenKhoaHoc}
                </div>
                <div className="mt-1 text-muted" style={{ fontSize: '12px' }}>
                  Mua ngay để nhận mã giảm giá đặc biệt!
                </div>
              </li>
            ))}
            {notifications.map(notif => {
              let displayContent = notif.noiDung;
              let link = '';
              if (notif.noiDung && notif.noiDung.includes('|||')) {
                const parts = notif.noiDung.split('|||');
                displayContent = parts[0];
                link = parts[1];
              }

              return (
              <li 
                key={notif.maTB} 
                className={`p-3 border-bottom ${!notif.daDoc ? 'bg-light' : ''}`}
                style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                onClick={() => {
                  if (!notif.daDoc) markAsRead(notif.maTB);
                  if (link) navigate(link);
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <strong style={{ fontSize: '14px', color: !notif.daDoc ? '#11B67A' : '#333', marginBottom: '4px' }}>
                    {notif.tieuDe}
                  </strong>
                  <small className="text-muted ms-2 flex-shrink-0" style={{ fontSize: '11px' }}>
                    {new Date(notif.thoiGian).toLocaleDateString('vi-VN')}
                  </small>
                </div>
                <div className="mt-1 text-muted" style={{ fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                  {displayContent}
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};
