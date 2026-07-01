import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import axiosClient from '../../api/axios';
import toast from 'react-hot-toast';
import { BreadcrumbBox } from '../../features/student-portal/components/common/Breadcrumb';
import { Styles } from '../../features/student-portal/pages/account/styles/account';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!token || !email) {
            toast.error('Đường dẫn không hợp lệ!');
            navigate('/login');
        }
    }, [token, email, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        if (password.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setIsLoading(true);
        try {
            await axiosClient.post('/auth/reset-password', { 
                token, 
                email, 
                newPassword: password 
            });
            
            toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
            navigate('/login');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra, có thể đường dẫn đã hết hạn');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token || !email) return null;

    return (
        <Styles>
            <div className="main-wrapper login-page">
                <BreadcrumbBox title="Đặt lại mật khẩu" />

                <section className="login-area">
                    <Container>
                        <Row>
                            <Col md={12}>
                                <div className="login-box">
                                    <div className="login-title text-center">
                                        <h3>Đặt lại mật khẩu</h3>
                                        <p style={{ marginTop: '10px', color: '#666' }}>
                                            Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
                                        </p>
                                    </div>
                                    <form onSubmit={handleSubmit} className="form">
                                        <p className="form-control" style={{ position: 'relative' }}>
                                            <label style={{ display: 'block', marginBottom: '8px' }}>Mật khẩu mới</label>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="*******"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                style={{ paddingRight: '45px' }}
                                            />
                                            <i 
                                                className={`las ${showPassword ? 'la-eye-slash' : 'la-eye'}`}
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{ 
                                                    position: 'absolute', 
                                                    right: '15px', 
                                                    top: '44px', 
                                                    cursor: 'pointer', 
                                                    fontSize: '20px', 
                                                    color: '#888',
                                                    zIndex: 10
                                                }}
                                            ></i>
                                        </p>
                                        <p className="form-control">
                                            <label style={{ display: 'block', marginBottom: '8px' }}>Xác nhận mật khẩu</label>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="*******"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </p>
                                        
                                        <button type="submit" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>
                                            {isLoading ? 'Đang cập nhật...' : 'Xác nhận Đổi Mật Khẩu'}
                                        </button>
                                        
                                        <div className="not_account-btn text-center" style={{ marginTop: '20px' }}>
                                            <p>Nhớ mật khẩu? <Link to="/login">Đăng nhập</Link></p>
                                        </div>
                                    </form>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>
            </div>
        </Styles>
    );
}
