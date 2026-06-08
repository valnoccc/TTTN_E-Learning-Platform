import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import axiosClient from '../../api/axios';
import toast from 'react-hot-toast';
import { normalizeRole } from '../../utils/roles';
import HeaderTwo from '../../features/student-portal/components/HeaderTwo';
import { BreadcrumbBox } from '../../features/student-portal/components/common/Breadcrumb';
import FooterTwo from '../../features/student-portal/components/FooterTwo';
import { Styles } from '../../features/student-portal/pages/account/styles/account';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Sửa ở đây: Loại bỏ bóc tách { data } vì axiosClient đã trả về data rồi
            const response: any = await axiosClient.post('/auth/login', { email, password });

            // Lưu thông tin vào LocalStorage (truy cập trực tiếp vào response)
            const role = normalizeRole(response.user?.role);
            const user = response.user ? { ...response.user, role } : null;

            localStorage.setItem('access_token', response.access_token);
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
            }

            toast.success('Đăng nhập thành công');

            if (role === 'ADMIN') navigate('/admin');
            else if (role === 'INSTRUCTOR') navigate('/instructor');
            else navigate('/');

        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Tài khoản hoặc mật khẩu không đúng');
        }
    };

    return (
        <Styles>
            <div className="main-wrapper login-page">
                {/* Header 2 */}
                <HeaderTwo />

                {/* Breadcroumb */}
                <BreadcrumbBox title="Log In" />

                {/* Login Area */}
                <section className="login-area">
                    <Container>
                        <Row>
                            <Col md={12}>
                                <div className="login-box">
                                    <div className="login-title text-center">
                                        <h3>Log In</h3>
                                    </div>
                                    <form onSubmit={handleLogin} className="form">
                                        <p className="form-control">
                                            <label style={{ display: 'block', marginBottom: '8px' }}>User Name</label>
                                            <input
                                                type="email"
                                                placeholder="Username"
                                                required
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </p>
                                        <p className="form-control">
                                            <label style={{ display: 'block', marginBottom: '8px' }}>Password</label>
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
                                        <button type="submit">Log In</button>
                                        <div className="save-forget-password d-flex justify-content-between">
                                            <div className="save-passowrd">
                                                <label>
                                                    <input type="checkbox" />
                                                    Save Password
                                                </label>
                                            </div>
                                            <div className="forget-password">
                                                <Link to="#">Forget Password?</Link>
                                            </div>
                                        </div>
                                        <div className="not_account-btn text-center">
                                            <p>Haven't Any Account Yet? <Link to="/register">Click Here</Link></p>
                                        </div>
                                        <div className="social-login text-center">
                                            <p>Login With Social</p>
                                            <ul className="list-unstyled d-flex justify-content-center" style={{ gap: '15px' }}>
                                                <li><Link to="#"><i className="fab fa-google"></i> Google</Link></li>
                                                <li><Link to="#"><i className="fab fa-facebook-f"></i> Facebook</Link></li>
                                            </ul>
                                        </div>
                                    </form>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Footer 2 */}
                <FooterTwo />
            </div>
        </Styles>
    );
}
