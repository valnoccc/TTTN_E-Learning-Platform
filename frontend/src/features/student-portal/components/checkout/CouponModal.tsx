import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { AvailableCoupon, getAvailableCoupons } from '../../../../api/checkout';

interface CouponModalProps {
  show: boolean;
  onHide: () => void;
  courseIds: number[];
  onSelectCoupon: (code: string) => void;
}

export const CouponModal: React.FC<CouponModalProps> = ({ show, onHide, courseIds, onSelectCoupon }) => {
  const [manualCode, setManualCode] = useState('');
  const [coupons, setCoupons] = useState<AvailableCoupon[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && courseIds.length > 0) {
      loadCoupons();
    }
  }, [show, courseIds]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await getAvailableCoupons(courseIds);
      
      // Sắp xếp: dùng được (isAvailable = true) lên trên, sau đó giảm giá (calculatedDiscount) nhiều nhất lên trên
      data.sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) {
          return a.isAvailable ? -1 : 1;
        }
        return (b.calculatedDiscount || 0) - (a.calculatedDiscount || 0);
      });
      
      setCoupons(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách mã giảm giá', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyManual = () => {
    if (manualCode.trim()) {
      onSelectCoupon(manualCode.trim());
      onHide();
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN') + ' đ';
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-b border-slate-200">
        <Modal.Title style={{ fontSize: '18px', fontWeight: 'bold' }}>Chọn Edumeo Voucher</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ backgroundColor: '#f5f5f5' }} className="p-4">
        {/* Manual Input Section */}
        <div className="manual-input mb-4 p-3 bg-white rounded-lg shadow-sm">
          <p className="mb-2 text-sm text-slate-600 font-medium">Mã Voucher</p>
          <div className="flex gap-2">
            <Form.Control
              type="text"
              placeholder="Nhập mã voucher tại đây"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              style={{ textTransform: 'uppercase' }}
              className="border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-md"
            />
            <Button 
              className={`px-4 border-0 font-medium whitespace-nowrap transition-colors ${manualCode.trim() ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              disabled={!manualCode.trim()}
              onClick={handleApplyManual}
            >
              Áp dụng
            </Button>
          </div>
        </div>

        {/* Coupons List Section */}
        <div className="coupons-list space-y-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center py-6">
              <Spinner animation="border" className="text-orange-500" size="sm" />
              <span className="ml-2 text-slate-500 text-sm">Đang tải mã giảm giá...</span>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              Chưa có mã giảm giá nào phù hợp.
            </div>
          ) : (
            coupons.map((coupon, index) => {
              const isBestChoice = index === 0 && coupon.isAvailable && (coupon.calculatedDiscount || 0) > 0;
              return (
              <div 
                key={coupon.id} 
                className={`flex bg-white rounded-lg shadow-sm overflow-hidden border transition-all relative ${!coupon.isAvailable ? 'opacity-50 border-slate-100' : isBestChoice ? 'border-orange-400 shadow-md ring-1 ring-orange-200' : 'border-slate-100 hover:shadow-md'}`}
                style={{ pointerEvents: coupon.isAvailable ? 'auto' : 'none' }}
              >
                {isBestChoice && (
                  <div className="absolute top-0 left-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg shadow-sm z-10">
                    Lựa chọn tốt nhất
                  </div>
                )}
                
                {/* Left side: Value */}
                <div className="w-1/3 bg-orange-50 flex flex-col items-center justify-center p-3 text-center border-r-2 border-dashed border-slate-200 relative pt-6">
                  <span className="text-orange-600 font-bold text-lg leading-tight">
                    {coupon.discountType === 'PERCENT' ? `${coupon.discountValue}%` : formatCurrency(coupon.discountValue)}
                  </span>
                  <span className="text-xs text-orange-500 font-medium mt-1">GIẢM</span>
                </div>

                {/* Right side: Info and Action */}
                <div className="w-2/3 p-3 flex flex-col justify-between">
                  <div>
                    <h6 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-1">{coupon.code}</h6>
                    {coupon.description && (
                      <p className="text-xs text-slate-500 mb-1 line-clamp-2">{coupon.description}</p>
                    )}
                    {coupon.endDate && (
                      <p className="text-[11px] text-slate-400 mb-0">
                        HSD: {new Date(coupon.endDate).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                    {!coupon.isAvailable && coupon.reason && (
                      <p className="text-[11px] text-red-500 italic mt-1">
                        * {coupon.reason}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-2">
                    <Button 
                      className={`text-xs px-4 py-1.5 rounded-full border-0 font-medium transition-colors ${coupon.isAvailable ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-slate-300 text-white'}`}
                      size="sm"
                      disabled={!coupon.isAvailable}
                      onClick={() => {
                        onSelectCoupon(coupon.code);
                        onHide();
                      }}
                    >
                      Dùng mã
                    </Button>
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
};
