import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import { Styles } from './styles/checkout';
import {
  CouponResponse,
  CourseDetailsData,
  getCourseDetails,
  processPayment,
  validateCoupon,
  createMomoPayment,
  getAvailableCoupons,
  AvailableCoupon,
} from '../../../../api/checkout';
import { removeFromCart } from '../../../cart/cartSlice';
import { CouponModal } from '../../components/checkout/CouponModal';
import { VoucherTrigger } from '../../components/checkout/VoucherTrigger';

const BANKS = [
  { id: 'vcb', name: 'Vietcombank', logo: '/assets/images/banks/VCB.png' },
  { id: 'tcb', name: 'Techcombank', logo: '/assets/images/banks/TCB.png' },
  { id: 'mbb', name: 'MBBank', logo: '/assets/images/banks/MB.png' },
  { id: 'icb', name: 'VietinBank', logo: '/assets/images/banks/ICB.png' },
  { id: 'bidv', name: 'BIDV', logo: '/assets/images/banks/BIDV.png' },
  { id: 'acb', name: 'ACB', logo: '/assets/images/banks/ACB.png' },
];

export default function Checkout() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [courses, setCourses] = useState<CourseDetailsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('MOMO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState<{ invoiceId: number } | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [discountValue, setDiscountValue] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResponse | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showCouponModal, setShowCouponModal] = useState(false);

  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    cardName: '',
    issueDate: '',
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      toast.error('Bạn cần đăng nhập để tiến hành thanh toán!');
      navigate('/login');
      return;
    } else {
      try {
        const parsedUser = JSON.parse(user);
        setFormData(prev => ({
          ...prev,
          fullName: parsedUser.HoTen || '',
          email: parsedUser.Email || '',
          phone: parsedUser.SoDienThoai || '',
        }));
      } catch (e) {}
    }

    if (location.state?.selectedCourses && location.state.selectedCourses.length > 0) {
      setCourses(location.state.selectedCourses);
      setLoading(false);
    } else if (courseId) {
      // ── PHÒNG VỆ NaN: ép kiểu & validate trước khi gọi API ──────────────────
      const targetId = parseInt(courseId, 10);
      if (isNaN(targetId)) {
        console.warn('>>> [GUARD] Bỏ qua fetch khóa học vì courseId không hợp lệ (NaN):', courseId);
        toast.error('Mã khóa học không hợp lệ!');
        navigate('/student/cart');
        return;
      }
      void loadCourseData(targetId);
    } else {
      toast.error('Không có khóa học nào được chọn!');
      navigate('/student/cart');
    }
  }, [courseId, location.state, navigate]);

  useEffect(() => {
    if (successData) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [successData]);

  const autoApplyBestCoupon = async (courseIds: number[]) => {
    try {
      const availableCoupons = await getAvailableCoupons(courseIds);
      if (availableCoupons && availableCoupons.length > 0) {
        availableCoupons.sort((a: AvailableCoupon, b: AvailableCoupon) => {
          if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
          return (b.calculatedDiscount || 0) - (a.calculatedDiscount || 0);
        });
        const bestCoupon = availableCoupons[0];
        if (bestCoupon && bestCoupon.isAvailable && (bestCoupon.calculatedDiscount || 0) > 0) {
          handleApplyCoupon(bestCoupon.code);
        }
      }
    } catch (err) {
      console.error('Failed to auto-apply best coupon', err);
    }
  };

  useEffect(() => {
    // Handle auto-apply coupon from Cart or automatically find the best one
    if (courses.length > 0 && !couponCode) {
      if (location.state?.appliedCouponCode) {
        handleApplyCoupon(location.state.appliedCouponCode);
      } else {
        autoApplyBestCoupon(courses.map(c => c.id));
      }
    }
  }, [courses, location.state?.appliedCouponCode, couponCode]);

  const loadCourseData = async (id: number) => {
    try {
      setLoading(true);
      const data = await getCourseDetails(id);
      setCourses([data]);
    } catch {
      toast.error('Không thể tải thông tin khóa học');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCardInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardInfo({
      ...cardInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = typeof codeToApply === 'string' ? codeToApply : couponCode;
    if (!code.trim()) {
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const res = await validateCoupon(
        code.trim(),
        courses.map((course) => course.id),
      );

      if (res.valid) {
        setAppliedCoupon(res);
        setDiscountValue(res.discountAmount);
        setCouponCode(code.trim());
        toast.success(res.message || 'Áp dụng mã giảm giá thành công!');
      }
    } catch (error: any) {
      setAppliedCoupon(null);
      setDiscountValue(0);
      setCouponCode('');
      toast.error(
        error.response?.data?.message || 'Mã giảm giá không hợp lệ',
      );
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handlePayment = async () => {
    const errors: { [key: string]: string } = {};

    if (!formData.fullName) errors.fullName = 'Vui lòng nhập họ và tên';
    if (!formData.email) errors.email = 'Vui lòng nhập địa chỉ email';
    if (!formData.phone) errors.phone = 'Vui lòng nhập số điện thoại';

    if (paymentMethod === 'VNPAY') {
      if (!selectedBank) toast.error('Vui lòng chọn ngân hàng thanh toán');
      if (!cardInfo.cardNumber) errors.cardNumber = 'Vui lòng nhập số thẻ';
      if (!cardInfo.cardName) errors.cardName = 'Vui lòng nhập tên in trên thẻ';
      if (!cardInfo.issueDate) errors.issueDate = 'Vui lòng nhập ngày phát hành (MM/YY)';
    }

    if (Object.keys(errors).length > 0 || (paymentMethod === 'VNPAY' && !selectedBank)) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    try {
      setIsProcessing(true);

      // ── MoMo: Tạo QR động & chuyển hướng ─────────────────────────────────
      if (paymentMethod === 'MOMO') {
        toast.loading('Đang kết nối MoMo...', { id: 'momo-loading' });
        const res = await createMomoPayment({
          courseIds: courses.map((c) => c.id),
          couponCode: discountValue > 0 ? couponCode : undefined,
          customerDetails: formData,
        });
        toast.dismiss('momo-loading');
        if (res.payUrl) {
          toast.success('Đang chuyển đến MoMo...');
          // Xóa gợi ý cross-sell cũ
          localStorage.removeItem('edumeo_cross_sell');
          window.dispatchEvent(new Event('edumeo_cross_sell_updated'));
          window.location.href = res.payUrl;
        } else {
          toast.error('Không nhận được link thanh toán MoMo.');
        }
        return;
      }

      // ── Các phương thức khác (BANK / VNPAY / PAYPAL) ──────────────────────
      const res = await processPayment({
        courseIds: courses.map((course) => course.id),
        paymentMethod,
        couponCode: discountValue > 0 ? couponCode : undefined,
        customerDetails: formData,
      });

      if (res.success) {
        // Xóa gợi ý cross-sell cũ
        localStorage.removeItem('edumeo_cross_sell');
        window.dispatchEvent(new Event('edumeo_cross_sell_updated'));
        courses.forEach((course) => dispatch(removeFromCart(course.id)));
        setSuccessData({ invoiceId: res.invoiceId });
        window.scrollTo(0, 0);
        toast.success('Thanh toán thành công!');
        setTimeout(() => {
          navigate('/student/profile');
        }, 3000);
      }
    } catch (error: any) {
      toast.dismiss('momo-loading');
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Thanh toán thất bại. Vui lòng thử lại.';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Thanh toán thất bại. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '100vh' }}
      >
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  if (successData) {
    return (
      <Styles>
        <div className="main-wrapper checkout-page">
          <Container>
            <div className="card-box py-5 text-center">
              <i
                className="las la-check-circle text-success"
                style={{ fontSize: '80px' }}
              />
              <h2 className="mt-3 mb-4">Thanh toán thành công!</h2>
              <p>
                Mã hóa đơn: <strong>#{successData.invoiceId}</strong>
              </p>
              <p>
                Khóa học:{' '}
                <strong>{courses.map((course) => course.courseName).join(', ')}</strong>
              </p>
              <p>
                Phương thức thanh toán: <strong>{paymentMethod}</strong>
              </p>
              <p className="text-muted mt-4">
                Chuyển hướng đến khóa học của bạn trong 3 giây...
              </p>
            </div>
          </Container>
        </div>
      </Styles>
    );
  }

  const totalOriginalPrice = courses.reduce((sum, course) => sum + course.price, 0);
  const finalPrice = Math.max(0, totalOriginalPrice - discountValue);

  return (
    <Styles>
      <div className="main-wrapper checkout-page">
        <BreadcrumbBox title="Thanh toán" />

        <section className="checkout-area">
          <Container>
            <Row>
              <Col lg={7}>
                <div className="card-box">
                  <h4 className="title">Thông tin thanh toán</h4>
                  <form className="billing-form">
                    <Row>
                      <Col md={12} className="mb-3">
                        <label>Họ và tên *</label>
                        <input
                          type="text"
                          name="fullName"
                          className={`form-control ${formErrors.fullName ? 'is-invalid' : ''}`}
                          placeholder="Nhập họ và tên"
                          value={formData.fullName}
                          onChange={handleInputChange}
                        />
                        {formErrors.fullName && <small className="text-danger mt-1 d-block">{formErrors.fullName}</small>}
                      </Col>
                      <Col md={6} className="mb-3">
                        <label>Địa chỉ Email *</label>
                        <input
                          type="email"
                          name="email"
                          className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                          placeholder="Nhập địa chỉ email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                        {formErrors.email && <small className="text-danger mt-1 d-block">{formErrors.email}</small>}
                      </Col>
                      <Col md={6} className="mb-3">
                        <label>Số điện thoại *</label>
                        <input
                          type="text"
                          name="phone"
                          className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                          placeholder="Nhập số điện thoại"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                        {formErrors.phone && <small className="text-danger mt-1 d-block">{formErrors.phone}</small>}
                      </Col>
                    </Row>
                  </form>
                </div>

                <div className="card-box">
                  <h4 className="title">Phương thức thanh toán</h4>
                  <div className="payment-methods">
                    <div
                      className={`payment-card ${paymentMethod === 'MOMO' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('MOMO')}
                    >
                      <img
                        src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png"
                        alt="MoMo"
                      />
                      <span>MoMo</span>
                    </div>
                    <div
                      className={`payment-card ${paymentMethod === 'VNPAY' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('VNPAY')}
                    >
                      <img
                        src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg"
                        alt="VNPay"
                      />
                      <span>Thẻ ATM / VNPay</span>
                    </div>
                    <div
                      className={`payment-card ${paymentMethod === 'BANK' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('BANK')}
                    >
                      <i
                        className="las la-university text-primary"
                        style={{ fontSize: '30px' }}
                      />
                      <span>Chuyển khoản</span>
                    </div>
                    <div
                      className={`payment-card ${paymentMethod === 'PAYPAL' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('PAYPAL')}
                    >
                      <i
                        className="fab fa-paypal text-primary"
                        style={{ fontSize: '30px' }}
                      />
                      <span>PayPal</span>
                    </div>
                  </div>

                  {paymentMethod === 'VNPAY' ? (
                    <div className="vnpay-details mt-4">
                      <h6 className="mb-3">Chọn ngân hàng</h6>
                      <div className="d-flex flex-wrap mb-4" style={{ gap: '10px' }}>
                        {BANKS.map((bank) => (
                          <div
                            key={bank.id}
                            className={`bank-card border rounded p-2 text-center`}
                            style={{ 
                              width: '100px', 
                              cursor: 'pointer',
                              borderColor: selectedBank === bank.id ? '#28a745' : '#dee2e6',
                              borderWidth: selectedBank === bank.id ? '2px' : '1px',
                              opacity: selectedBank && selectedBank !== bank.id ? 0.6 : 1,
                              backgroundColor: selectedBank === bank.id ? '#f8fff9' : '#fff'
                            }}
                            onClick={() => setSelectedBank(bank.id)}
                          >
                            <img 
                              src={bank.logo} 
                              alt={bank.name} 
                              style={{ width: '100%', height: '40px', objectFit: 'contain' }} 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://placehold.co/100x40/ffffff/333333?text=${bank.id.toUpperCase()}`;
                              }}
                            />
                            <small className="d-block mt-1 text-muted" style={{ fontSize: '11px', fontWeight: selectedBank === bank.id ? 'bold' : 'normal' }}>{bank.name}</small>
                          </div>
                        ))}
                      </div>

                      {selectedBank && (
                        <div className="card-info-form p-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                          <h6 className="mb-3">Thông tin thẻ</h6>
                          <form>
                            <Row>
                              <Col md={12} className="mb-3">
                                <label style={{ fontSize: '14px' }}>Số thẻ</label>
                                <input
                                  type="text"
                                  name="cardNumber"
                                  className={`form-control ${formErrors.cardNumber ? 'is-invalid' : ''}`}
                                  placeholder="Nhập số thẻ (VD: 9704...)"
                                  value={cardInfo.cardNumber}
                                  onChange={handleCardInfoChange}
                                />
                                {formErrors.cardNumber && <small className="text-danger mt-1 d-block">{formErrors.cardNumber}</small>}
                              </Col>
                              <Col md={6} className="mb-3">
                                <label style={{ fontSize: '14px' }}>Tên in trên thẻ</label>
                                <input
                                  type="text"
                                  name="cardName"
                                  className={`form-control ${formErrors.cardName ? 'is-invalid' : ''}`}
                                  placeholder="Tên không dấu (VD: NGUYEN VAN A)"
                                  value={cardInfo.cardName}
                                  onChange={handleCardInfoChange}
                                  style={{ textTransform: 'uppercase' }}
                                />
                                {formErrors.cardName && <small className="text-danger mt-1 d-block">{formErrors.cardName}</small>}
                              </Col>
                              <Col md={6} className="mb-3">
                                <label style={{ fontSize: '14px' }}>Ngày phát hành</label>
                                <input
                                  type="text"
                                  name="issueDate"
                                  className={`form-control ${formErrors.issueDate ? 'is-invalid' : ''}`}
                                  placeholder="MM/YY"
                                  value={cardInfo.issueDate}
                                  onChange={handleCardInfoChange}
                                />
                                {formErrors.issueDate && <small className="text-danger mt-1 d-block">{formErrors.issueDate}</small>}
                              </Col>
                            </Row>
                            <p className="text-warning mt-2 mb-0" style={{ fontSize: '13px', fontWeight: 'bold' }}>
                              <i className="las la-info-circle mr-1" style={{ fontSize: '16px' }} />
                              Lưu ý: Đây là môi trường Demo, thanh toán sẽ không bị trừ tiền thật.
                            </p>
                          </form>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {paymentMethod === 'MOMO' ? (
                    <div className="momo-details mt-4 p-4 rounded-lg" style={{ background: 'linear-gradient(135deg, #fff0f6 0%, #ffe4f0 100%)', border: '1.5px solid #d82d8b' }}>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png"
                          alt="MoMo"
                          style={{ width: '56px', height: '56px', borderRadius: '12px', flexShrink: 0 }}
                        />
                        <div>
                          <h6 className="mb-1 fw-bold" style={{ color: '#a5006b' }}>Thanh toán qua Ví MoMo</h6>
                          <p className="mb-0" style={{ fontSize: '13px', color: '#555' }}>
                            Bấm <strong>"Xác nhận thanh toán"</strong> để được chuyển đến trang thanh toán
                            chính thức của MoMo Sandbox. Quét mã QR hoặc xác nhận trên app.
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 p-2 rounded" style={{ background: 'rgba(168, 0, 107, 0.07)', fontSize: '13px' }}>
                        <span style={{ color: '#a5006b' }}>🔒</span>{' '}
                        <span style={{ color: '#555' }}>Giao dịch được bảo mật bởi MoMo. Hệ thống sẽ tự động ghi danh khóa học sau khi thanh toán thành công.</span>
                      </div>
                    </div>
                  ) : null}

                  {paymentMethod === 'BANK' ? (
                    <div className="bank-details mt-4">
                      <div className="qr-code">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"
                          alt="QR Code"
                        />
                      </div>
                      <div className="info">
                        <p>
                          Ngân hàng: <strong>Vietcombank</strong>
                        </p>
                        <p>
                          Tên tài khoản: <strong>EDUMEO COMPANY</strong>
                        </p>
                        <p>
                          Số tài khoản: <strong>123456789</strong>
                        </p>
                        <p className="text-muted mt-2 mb-0" style={{ fontSize: '13px' }}>
                          Vui lòng quét mã QR và ghi rõ số điện thoại của bạn trong nội dung
                          chuyển khoản.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Col>

              <Col lg={5}>
                <div className="card-box order-summary">
                  <h4 className="title">Thông tin đơn hàng</h4>

                  {courses.map((course, idx) => (
                    <div
                      className="course-info mb-3"
                      key={idx}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <img
                        src={course.thumbnail}
                        alt={course.courseName}
                        style={{
                          width: '80px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                        }}
                      />
                      <div className="details ml-3">
                        <h6 className="mb-1" style={{ fontSize: '15px' }}>
                          {course.courseName}
                        </h6>
                        <p className="mb-0" style={{ fontSize: '13px' }}>
                          Giảng viên: {course.instructor}
                        </p>
                      </div>
                    </div>
                  ))}

                  <VoucherTrigger 
                    couponCode={couponCode}
                    onClick={() => setShowCouponModal(true)}
                  />

                  <ul className="list-unstyled price-list">
                    <li>
                      <span>Giá gốc</span>
                      <span>{totalOriginalPrice.toLocaleString('vi-VN')} đ</span>
                    </li>
                    {appliedCoupon ? (
                      <li>
                        <span>Áp dụng cho</span>
                        <span>{appliedCoupon.matchedCourseName}</span>
                      </li>
                    ) : null}
                    {discountValue > 0 ? (
                      <li className="discount">
                        <span>Giảm giá</span>
                        <span>-{discountValue.toLocaleString('vi-VN')} đ</span>
                      </li>
                    ) : null}
                    <li className="total">
                      <span>Tổng cộng</span>
                      <span>{finalPrice.toLocaleString('vi-VN')} đ</span>
                    </li>
                  </ul>

                  <button
                    className="confirm-btn"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />{' '}
                        Đang xử lý...
                      </>
                    ) : (
                      'Xác nhận thanh toán'
                    )}
                  </button>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Coupon Modal */}
        <CouponModal 
          show={showCouponModal}
          onHide={() => setShowCouponModal(false)}
          courseIds={courses.map(c => c.id)}
          onSelectCoupon={(code) => handleApplyCoupon(code)}
        />
      </div>
    </Styles>
  );
}
