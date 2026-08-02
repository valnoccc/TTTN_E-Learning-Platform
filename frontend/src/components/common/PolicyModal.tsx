import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PolicyModalProps {
  isOpen: boolean;
  type: 'instructor' | 'forum';
  onAccept: () => void;
  onDecline?: () => void;
}

export function PolicyModal({ isOpen, type, onAccept, onDecline }: PolicyModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  const title = type === 'instructor' ? 'Chính sách Giảng viên (Instructor Policy)' : 'Nội quy Diễn đàn (Forum Policy)';
  
  const renderInstructorPolicy = () => (
    <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
      <div>
        <h3 className="font-semibold text-slate-900">1. Bản quyền và Sở hữu trí tuệ</h3>
        <p>Giảng viên cam kết và đảm bảo sở hữu 100% bản quyền hợp pháp đối với toàn bộ nội dung bài giảng, tài liệu, video và hình ảnh được đăng tải. Mọi hành vi vi phạm bản quyền sẽ dẫn đến khóa tài khoản vĩnh viễn.</p>
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">2. Kiểm duyệt nội dung (AI Moderation)</h3>
        <p>Edumeo ứng dụng AI để phân tích video. Bất kỳ video nào chứa ngôn từ thô tục, bạo lực, phân biệt đối xử hoặc thông tin sai lệch sẽ bị tự động từ chối. Ban Quản trị giữ quyền quyết định cuối cùng.</p>
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">3. Chính sách tài chính và Thuế</h3>
        <p>Doanh thu được chia sẻ dựa trên doanh thu thuần (Net Revenue). Các giao dịch mua của cá nhân áp dụng VAT 0%. Giao dịch của doanh nghiệp (yêu cầu hóa đơn) cộng thêm 10% VAT (phần này nộp cho Nhà nước). Giảng viên tự chịu trách nhiệm kê khai và nộp Thuế TNCN đối với phần thu nhập được chia sẻ.</p>
      </div>
    </div>
  );

  const renderForumPolicy = () => (
    <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
      <div>
        <h3 className="font-semibold text-slate-900">1. Tôn trọng cộng đồng</h3>
        <p>Người dùng phải thể hiện thái độ văn minh, tôn trọng Giảng viên và Học viên khác trong không gian thảo luận.</p>
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">2. Các hành vi bị cấm</h3>
        <p>Nghiêm cấm lăng mạ, quấy rối, spam, quảng cáo trái phép hoặc lan truyền nội dung độc hại. Vi phạm sẽ dẫn đến việc hạn chế tính năng hoặc cấm tài khoản vĩnh viễn.</p>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">{title}</h2>
              <p className="text-sm text-slate-500 mt-1">Vui lòng đọc kỹ và đồng ý với các điều khoản dưới đây trước khi tiếp tục.</p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50/50">
              {type === 'instructor' ? renderInstructorPolicy() : renderForumPolicy()}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
              <label className="flex items-start gap-3 cursor-pointer group mb-6">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={(e) => setIsChecked(e.target.checked)} 
                    className="peer w-5 h-5 border-2 border-slate-300 rounded appearance-none checked:bg-emerald-600 checked:border-emerald-600 transition-colors cursor-pointer"
                  />
                  <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-800 group-hover:text-slate-900 transition-colors">
                  Tôi đã đọc, hiểu rõ và đồng ý tuân thủ toàn bộ các chính sách nêu trên.
                </span>
              </label>

              <div className="flex justify-end gap-3">
                {onDecline && (
                  <button 
                    onClick={onDecline} 
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Hủy bỏ / Quay lại
                  </button>
                )}
                <button 
                  disabled={!isChecked}
                  onClick={onAccept}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Xác nhận Đồng ý
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
