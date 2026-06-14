import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import { Styles } from './styles/checkout';
import {
  consumeCoupon,
  CouponResponse,
  CourseDetailsData,
  getCourseDetails,
  processPayment,
  validateCoupon,
} from '../../../../api/checkout';
import { removeFromCart } from '../../../cart/cartSlice';

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

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      toast.error('Bạn cần đăng nhập để tiến hành thanh toán!');
      navigate('/login');
      return;
    }

    if (location.state?.selectedCourses && location.state.selectedCourses.length > 0) {
      setCourses(location.state.selectedCourses);
      setLoading(false);
    } else if (courseId) {
      void loadCourseData(Number(courseId));
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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      return;
    }

    try {
      setIsApplyingCoupon(true);
      const res = await validateCoupon(
        couponCode.trim(),
        courses.map((course) => course.id),
      );

      if (res.valid) {
        setAppliedCoupon(res);
        setDiscountValue(res.discountAmount);
        toast.success(res.message || 'Áp dụng mã giảm giá thành công!');
      }
    } catch (error: any) {
      setAppliedCoupon(null);
      setDiscountValue(0);
      toast.error(
        error.response?.data?.message || 'Mã giảm giá không hợp lệ',
      );
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handlePayment = async () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error('Vui lòng điền đầy đủ thông tin thanh toán');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await processPayment({
        courseIds: courses.map((course) => course.id),
        paymentMethod,
        couponCode: discountValue > 0 ? couponCode : undefined,
        customerDetails: formData,
      });

      if (res.success) {
        if (appliedCoupon?.couponId) {
          await consumeCoupon(appliedCoupon.couponId);
        }

        courses.forEach((course) => dispatch(removeFromCart(course.id)));

        const totalOriginalPrice = courses.reduce((sum, course) => sum + course.price, 0);
        const finalPrice = Math.max(0, totalOriginalPrice - discountValue);

        const myCourses = JSON.parse(localStorage.getItem('myCourses') || '[]');
        const newCourses = courses.map((course) => ({
          id: course.id,
          title: course.courseName,
          progress: 0,
          image: course.thumbnail,
        }));

        const updatedCourses = [...myCourses];
        newCourses.forEach((newCourse) => {
          if (!updatedCourses.find((course) => course.id === newCourse.id)) {
            updatedCourses.push(newCourse);
          }
        });
        localStorage.setItem('myCourses', JSON.stringify(updatedCourses));

        const paymentHistory = JSON.parse(localStorage.getItem('paymentHistory') || '[]');
        const newPayment = {
          id: `INV-${res.invoiceId}`,
          date: new Date().toISOString().split('T')[0],
          amount: finalPrice,
          status: 'Success',
        };
        localStorage.setItem(
          'paymentHistory',
          JSON.stringify([newPayment, ...paymentHistory]),
        );

        setSuccessData({ invoiceId: res.invoiceId });
        window.scrollTo(0, 0);
        toast.success('Thanh toán thành công!');
        setTimeout(() => {
          navigate('/student/profile');
        }, 3000);
      }
    } catch {
      toast.error('Thanh toán thất bại. Vui lòng thử lại.');
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
                      <Col md={12}>
                        <label>Họ và tên *</label>
                        <input
                          type="text"
                          name="fullName"
                          className="form-control"
                          placeholder="Nhập họ và tên"
                          value={formData.fullName}
                          onChange={handleInputChange}
                        />
                      </Col>
                      <Col md={6}>
                        <label>Địa chỉ Email *</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          placeholder="Nhập địa chỉ email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </Col>
                      <Col md={6}>
                        <label>Số điện thoại *</label>
                        <input
                          type="text"
                          name="phone"
                          className="form-control"
                          placeholder="Nhập số điện thoại"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
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
                      <span>VNPay</span>
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

                  {paymentMethod === 'BANK' ? (
                    <div className="bank-details">
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
                        src={process.env.PUBLIC_URL + course.thumbnail}
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

                  <div className="coupon-box">
                    <input
                      type="text"
                      placeholder="Mã giảm giá"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || isApplyingCoupon}
                    >
                      {isApplyingCoupon ? '...' : 'Áp dụng'}
                    </button>
                  </div>

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
      </div>
    </Styles>
  );
}
