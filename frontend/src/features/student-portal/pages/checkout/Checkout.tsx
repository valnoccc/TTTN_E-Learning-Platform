import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function Checkout() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Course State
  const [course, setCourse] = useState<CourseDetailsData | null>(null);
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
    if (courseId) {
      loadCourseData(Number(courseId));
    }
  }, [courseId]);

  const loadCourseData = async (id: number) => {
    try {
      setLoading(true);
      const data = await getCourseDetails(id);
      setCourse(data);
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
      const res = await validateCoupon(couponCode, Number(courseId));
      if (res.valid) {
        if (res.discountType === 'PERCENT' && course) {
          setDiscountValue(course.price * (res.discountValue / 100));
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
        courseId: Number(courseId),
        paymentMethod,
        couponCode: discountValue > 0 ? couponCode : undefined,
        customerDetails: formData,
      });

      if (res.success) {
        setSuccessData({ invoiceId: res.invoiceId });
        toast.success('Payment successful!');
        setTimeout(() => {
          navigate('/student/my-courses');
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
              <p>Course: <strong>{course?.courseName}</strong></p>
              <p>Payment Method: <strong>{paymentMethod}</strong></p>
              <p className="text-muted mt-4">Redirecting to your courses in 3 seconds...</p>
            </div>
          </Container>
</div>
      </Styles>
    );
  }

  const finalPrice = course ? Math.max(0, course.price - discountValue) : 0;

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
                  
                  {course && (
                    <div className="course-info">
                      <img src={process.env.PUBLIC_URL + course.thumbnail} alt={course.courseName} />
                      <div className="details">
                        <h6>{course.courseName}</h6>
                        <p>By {course.instructor}</p>
                      </div>
                    </div>
                  )}

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
                      <span>${course?.price.toFixed(2)}</span>
                    </li>
                    {discountValue > 0 && (
                      <li className="discount">
                        <span>Discount</span>
                        <span>-${discountValue.toFixed(2)}</span>
                      </li>
                    )}
                    <li className="total">
                      <span>Total</span>
                      <span>${finalPrice.toFixed(2)}</span>
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
