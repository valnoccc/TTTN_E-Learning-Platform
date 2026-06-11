import React from 'react';
import { Dropdown } from 'react-bootstrap';
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

  return (
    <Dropdown align="end">
      <Dropdown.Toggle as={CustomToggle} id="dropdown-notifications">
        <i className="las la-bell" style={{ fontSize: '24px' }}></i>
        {unreadCount > 0 && (
          <span
            className="position-absolute badge rounded-pill bg-danger text-white"
            style={{ fontSize: '11px', top: '0', right: '0' }}
          >
            {unreadCount}
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
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted">
            <i className="las la-bell-slash mb-2" style={{ fontSize: '32px', color: '#ccc' }}></i>
            <p className="m-0" style={{ fontSize: '14px' }}>Không có thông báo nào</p>
          </div>
        ) : (
          <ul className="list-unstyled mb-0">
            {notifications.map(notif => (
              <li 
                key={notif.maTB} 
                className={`p-3 border-bottom ${!notif.daDoc ? 'bg-light' : ''}`}
                style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                onClick={() => {
                  if (!notif.daDoc) markAsRead(notif.maTB);
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
                  {notif.noiDung}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};
