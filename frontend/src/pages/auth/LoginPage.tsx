import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import axiosClient from '../../api/axios';
import toast from 'react-hot-toast';
import { normalizeRole } from '../../utils/roles';
import { BreadcrumbBox } from '../../features/student-portal/components/common/Breadcrumb';
import { Styles } from '../../features/student-portal/pages/account/styles/account';
import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();

    const handleLoginSuccess = (payload: any) => {
        const rawUser = payload.user || payload;
        const role = normalizeRole(rawUser?.role || rawUser?.vaiTro);
        const vaiTro = role;
        const user = rawUser ? { ...rawUser, role, vaiTro } : null;

        localStorage.setItem('access_token', payload.access_token || '');
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('auth-change'));

        toast.success('Đăng nhập thành công!');

        if (vaiTro === 'ADMIN') navigate('/admin');
        else if (vaiTro === 'INSTRUCTOR') navigate('/instructor');
        else navigate('/');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response: any = await axiosClient.post('/auth/login', { email, password });
            const payload = response.data || response;
            handleLoginSuccess(payload);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Tài khoản hoặc mật khẩu không đúng');
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setGoogleLoading(true);
            try {
                const response: any = await axiosClient.post('/auth/google-login', {
                    token: tokenResponse.access_token,
                });
                const payload = response.data || response;
                handleLoginSuccess(payload);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Đăng nhập bằng Google thất bại!');
            } finally {
                setGoogleLoading(false);
            }
        },
        onError: () => {
            toast.error('Đăng nhập Google bị hủy hoặc gặp lỗi!');
        },
    });

    return (
        <Styles>
            <div className="main-wrapper login-page">
                {/* Breadcroumb */}
                <BreadcrumbBox title="Đăng nhập" />

                {/* Login Area */}
                <section className="login-area">
                    <Container>
                        <Row>
                            <Col md={12}>
                                <div className="login-box">
                                    <div className="login-title text-center">
                                        <h3>Đăng nhập</h3>
                                    </div>
                                    <form onSubmit={handleLogin} className="form">
                                        <p className="form-control">
                                            <label style={{ display: 'block', marginBottom: '8px' }}>Địa chỉ Email</label>
                                            <input
                                                type="email"
                                                placeholder="Email address"
                                                required
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </p>
                                        <p className="form-control">
                                            <label style={{ display: 'block', marginBottom: '8px' }}>Mật khẩu</label>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="*******"
                                                required
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
                                        <button type="submit">Đăng Nhập</button>
                                        <div className="save-forget-password d-flex justify-content-between">
                                            <div className="save-passowrd">
                                                <label>
                                                    <input type="checkbox" />
                                                    Nhớ mật khẩu
                                                </label>
                                            </div>
                                            <div className="forget-password">
                                                <Link to="/forgot-password">Quên mật khẩu?</Link>
                                            </div>
                                        </div>
                                        <div className="not_account-btn text-center">
                                            <p>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
                                        </div>
                                        <div className="social-login text-center">
                                            <p>Đăng nhập bằng mạng xã hội</p>
                                            <ul className="list-unstyled d-flex justify-content-center" style={{ gap: '15px' }}>
                                                <li>
                                                    <a 
                                                        href="#" 
                                                        onClick={(e) => { 
                                                            e.preventDefault(); 
                                                            if (!googleLoading) googleLogin(); 
                                                        }}
                                                        style={{
                                                            opacity: googleLoading ? 0.7 : 1,
                                                            cursor: googleLoading ? 'not-allowed' : 'pointer'
                                                        }}
                                                    >
                                                        <i className="fab fa-google"></i> {googleLoading ? 'Đang xử lý...' : 'Google'}
                                                    </a>
                                                </li>
                                                <li><Link to="#"><i className="fab fa-facebook-f"></i> Facebook</Link></li>
                                            </ul>
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
