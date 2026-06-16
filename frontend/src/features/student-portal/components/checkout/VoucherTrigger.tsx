import React from 'react';

interface VoucherTriggerProps {
  couponCode: string;
  onClick: () => void;
}

export const VoucherTrigger: React.FC<VoucherTriggerProps> = ({ couponCode, onClick }) => {
  return (
    <div 
      className="flex justify-between items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors mb-5 shadow-sm"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <i className="las la-ticket-alt text-orange-500 text-2xl" />
        <span className="font-semibold text-slate-700">Edumeo Voucher</span>
      </div>
      
      {couponCode ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-orange-600 border border-orange-200 bg-orange-50 px-2 py-0.5 rounded">
            {couponCode}
          </span>
          <span className="text-sm font-medium text-slate-400">&gt;</span>
        </div>
      ) : (
        <span className="text-sm font-medium text-blue-500 hover:text-blue-600">
          Chọn hoặc nhập mã &gt;
        </span>
      )}
    </div>
  );
};
