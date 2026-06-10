import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { BreadcrumbBox } from '../../components/common/Breadcrumb';
import { Styles } from './styles/checkout';
import {
  getCourseDetails,
  validateCoupon,
  processPayment,
  CourseDetailsData,
} from '../../../../api/checkout';
import { useDispatch } from 'react-redux';
import { removeFromCart } from '../../../cart/cartSlice';

export default function Checkout() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Course State
  const [courses, setCourses] = useState<CourseDetailsData[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('MOMO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successData, setSuccessData] = useState<{ invoiceId: number } | null>(null);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [discountValue, setDiscountValue] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    if (location.state?.selectedCourses && location.state.selectedCourses.length > 0) {
      setCourses(location.state.selectedCourses);
      setLoading(false);
    } else if (courseId) {
      loadCourseData(Number(courseId));
    } else {
      toast.error('Không có khóa học nào được chọn!');
      navigate('/student/cart');
    }
  }, [courseId, location.state, navigate]);

  const loadCourseData = async (id: number) => {
    try {
      setLoading(true);
      const data = await getCourseDetails(id);
      setCourses([data]);
    } catch (error) {
      toast.error('Failed to load course details');
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
    if (!couponCode) return;
    try {
      setIsApplyingCoupon(true);
      const res = await validateCoupon(couponCode, courses[0]?.id || Number(courseId));
      if (res.valid) {
        const totalOriginalPrice = courses.reduce((sum, c) => sum + c.price, 0);
        if (res.discountType === 'PERCENT' && courses.length > 0) {
          setDiscountValue(totalOriginalPrice * (res.discountValue / 100));
        } else {
          setDiscountValue(res.discountValue);
        }
        toast.success('Coupon applied successfully!');
      }
    } catch (error: any) {
      setDiscountValue(0);
      toast.error(error.message || 'Invalid coupon code');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handlePayment = async () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error('Please fill in all billing information');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await processPayment({
        courseIds: courses.map(c => c.id),
        paymentMethod,
        couponCode: discountValue > 0 ? couponCode : undefined,
        customerDetails: formData,
      });

      if (res.success) {
        // Remove purchased items from cart
        courses.forEach(c => dispatch(removeFromCart(c.id)));

        // Mock save to localStorage for StudentProfile
        const totalOriginalPrice = courses.reduce((sum, c) => sum + c.price, 0);
        const finalPrice = Math.max(0, totalOriginalPrice - discountValue);

        const myCourses = JSON.parse(localStorage.getItem('myCourses') || '[]');
        const newCourses = courses.map(c => ({
            id: c.id,
            title: c.courseName,
            progress: 0,
            image: c.thumbnail
        }));
        // Avoid duplicates
        const updatedCourses = [...myCourses];
        newCourses.forEach(nc => {
            if (!updatedCourses.find(c => c.id === nc.id)) {
                updatedCourses.push(nc);
            }
        });
        localStorage.setItem('myCourses', JSON.stringify(updatedCourses));

        const paymentHistory = JSON.parse(localStorage.getItem('paymentHistory') || '[]');
        const newPayment = {
            id: `INV-${res.invoiceId}`,
            date: new Date().toISOString().split('T')[0],
            amount: finalPrice,
            status: 'Success'
        };
        localStorage.setItem('paymentHistory', JSON.stringify([newPayment, ...paymentHistory]));

        setSuccessData({ invoiceId: res.invoiceId });
        toast.success('Payment successful!');
        setTimeout(() => {
          navigate('/student/profile'); // Changed to profile since my-courses is inside StudentProfile tab
        }, 3000);
      }
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="success" />
      </div>
    );
  }

  if (successData) {
    return (
      <Styles>
        <div className="main-wrapper checkout-page">
<Container>
            <div className="card-box text-center py-5">
              <i className="las la-check-circle text-success" style={{ fontSize: '80px' }}></i>
              <h2 className="mt-3 mb-4">Payment Successful!</h2>
              <p>Invoice ID: <strong>#{successData.invoiceId}</strong></p>
              <p>Course: <strong>{courses.map(c => c.courseName).join(', ')}</strong></p>
              <p>Payment Method: <strong>{paymentMethod}</strong></p>
              <p className="text-muted mt-4">Redirecting to your courses in 3 seconds...</p>
            </div>
          </Container>
</div>
      </Styles>
    );
  }

  const totalOriginalPrice = courses.reduce((sum, c) => sum + c.price, 0);
  const finalPrice = Math.max(0, totalOriginalPrice - discountValue);

  return (
    <Styles>
      <div className="main-wrapper checkout-page">
<BreadcrumbBox title="Checkout" />

        <section className="checkout-area">
          <Container>
            <Row>
              {/* LEFT COLUMN */}
              <Col lg={7}>
                <div className="card-box">
                  <h4 className="title">Billing Information</h4>
                  <form className="billing-form">
                    <Row>
                      <Col md={12}>
                        <label>Full Name *</label>
                        <input
                          type="text"
                          name="fullName"
                          className="form-control"
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={handleInputChange}
                        />
                      </Col>
                      <Col md={6}>
                        <label>Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          placeholder="Enter email address"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </Col>
                      <Col md={6}>
                        <label>Phone Number *</label>
                        <input
                          type="text"
                          name="phone"
                          className="form-control"
                          placeholder="Enter phone number"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </Col>
                    </Row>
                  </form>
                </div>

                <div className="card-box">
                  <h4 className="title">Payment Method</h4>
                  <div className="payment-methods">
                    <div
                      className={`payment-card ${paymentMethod === 'MOMO' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('MOMO')}
                    >
                      <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png" alt="MoMo" />
                      <span>MoMo</span>
                    </div>
                    <div
                      className={`payment-card ${paymentMethod === 'VNPAY' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('VNPAY')}
                    >
                      <img src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg" alt="VNPay" />
                      <span>VNPay</span>
                    </div>
                    <div
                      className={`payment-card ${paymentMethod === 'BANK' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('BANK')}
                    >
                      <i className="las la-university text-primary" style={{ fontSize: '30px' }}></i>
                      <span>Bank Transfer</span>
                    </div>
                    <div
                      className={`payment-card ${paymentMethod === 'PAYPAL' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('PAYPAL')}
                    >
                      <i className="fab fa-paypal text-primary" style={{ fontSize: '30px' }}></i>
                      <span>PayPal</span>
                    </div>
                  </div>

                  {paymentMethod === 'BANK' && (
                    <div className="bank-details">
                      <div className="qr-code">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR Code" />
                      </div>
                      <div className="info">
                        <p>Bank: <strong>Vietcombank</strong></p>
                        <p>Account Name: <strong>EDUMEO COMPANY</strong></p>
                        <p>Account Number: <strong>123456789</strong></p>
                        <p className="text-muted mt-2 mb-0" style={{ fontSize: '13px' }}>
                          Please scan the QR code and include your phone number in the transfer description.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Col>

              {/* RIGHT COLUMN */}
              <Col lg={5}>
                <div className="card-box order-summary">
                  <h4 className="title">Order Summary</h4>
                  
                  {courses.map((course, idx) => (
                    <div className="course-info mb-3" key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                      <img src={process.env.PUBLIC_URL + course.thumbnail} alt={course.courseName} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                      <div className="details ml-3">
                        <h6 className="mb-1" style={{ fontSize: '15px' }}>{course.courseName}</h6>
                        <p className="mb-0" style={{ fontSize: '13px' }}>By {course.instructor}</p>
                      </div>
                    </div>
                  ))}

                  <div className="coupon-box">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || isApplyingCoupon}
                    >
                      {isApplyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>

                  <ul className="list-unstyled price-list">
                    <li>
                      <span>Original Price</span>
                      <span>{totalOriginalPrice.toLocaleString('vi-VN')} đ</span>
                    </li>
                    {discountValue > 0 && (
                      <li className="discount">
                        <span>Discount</span>
                        <span>-{discountValue.toLocaleString('vi-VN')} đ</span>
                      </li>
                    )}
                    <li className="total">
                      <span>Total</span>
                      <span>{finalPrice.toLocaleString('vi-VN')} đ</span>
                    </li>
                  </ul>

                  <button
                    className="confirm-btn"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Processing...</>
                    ) : (
                      'Confirm Payment'
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
