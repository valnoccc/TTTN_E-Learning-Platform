import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import axiosClient from '../../api/axios';
import toast from 'react-hot-toast';
import { BreadcrumbBox } from '../../features/student-portal/components/common/Breadcrumb';
import { Styles } from '../../features/student-portal/pages/account/styles/account';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axiosClient.post('/auth/forgot-password', { email });
            toast.success('Đã gửi email khôi phục. Vui lòng kiểm tra hộp thư của bạn.');
            setIsSuccess(true);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Styles>
            <div className="main-wrapper login-page">
                <BreadcrumbBox title="Quên mật khẩu" />

                <section className="login-area">
                    <Container>
                        <Row>
                            <Col md={12}>
                                <div className="login-box">
                                    <div className="login-title text-center">
                                        <h3>Quên mật khẩu</h3>
                                        <p style={{ marginTop: '10px', color: '#666' }}>
                                            Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
                                        </p>
                                    </div>
                                    
                                    {isSuccess ? (
                                        <div className="text-center" style={{ padding: '20px' }}>
                                            <div style={{ fontSize: '40px', color: '#10b981', marginBottom: '10px' }}>
                                                <i className="las la-check-circle"></i>
                                            </div>
                                            <h5 style={{ color: '#10b981', marginBottom: '20px' }}>Đã gửi email thành công!</h5>
                                            <p style={{ color: '#666', marginBottom: '20px' }}>
                                                Vui lòng kiểm tra email <strong>{email}</strong> và làm theo hướng dẫn để đặt lại mật khẩu của bạn.
                                            </p>
                                            <Link to="/login" className="btn btn-primary" style={{ backgroundColor: '#10b981', border: 'none', padding: '10px 20px', borderRadius: '5px', color: 'white', textDecoration: 'none' }}>
                                                Quay lại đăng nhập
                                            </Link>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="form">
                                            <p className="form-control">
                                                <label style={{ display: 'block', marginBottom: '8px' }}>Địa chỉ Email</label>
                                                <input
                                                    type="email"
                                                    placeholder="Nhập email của bạn"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            </p>
                                            
                                            <button type="submit" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>
                                                {isLoading ? 'Đang xử lý...' : 'Gửi Yêu Cầu'}
                                            </button>
                                            
                                            <div className="not_account-btn text-center" style={{ marginTop: '20px' }}>
                                                <p>Nhớ mật khẩu? <Link to="/login">Đăng nhập</Link></p>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>
            </div>
        </Styles>
    );
}
