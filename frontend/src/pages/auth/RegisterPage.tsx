import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import axiosClient from '../../api/axios';
import toast from 'react-hot-toast';
import { BreadcrumbBox } from '../../features/student-portal/components/common/Breadcrumb';
import { Styles } from '../../features/student-portal/pages/account/styles/account';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        userName: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
            alert('Vui lòng điền đầy đủ tất cả các trường!');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            alert('Mật khẩu xác nhận không khớp');
            return;
        }

        try {
            setIsLoading(true);
            const submitData = {
                fullName: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                password: formData.password
            };
            
            const registerPromise = axiosClient.post('/auth/register', submitData);
            
            await toast.promise(registerPromise, {
                loading: 'Đang xử lý đăng ký...',
                success: 'Đăng ký thành công! Bạn có thể đăng nhập ngay.',
                error: (err: any) => {
                    const msg = err.response?.data?.message;
                    if (Array.isArray(msg)) return msg[0];
                    return msg || 'Đăng ký thất bại, vui lòng thử lại';
                }
            });

            navigate('/login');
        } catch (err: any) {
            // Error is already handled by toast.promise
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Styles>
            <div className="main-wrapper registration-page">
                {/* Breadcroumb */}
                <BreadcrumbBox title="Registration" />

                {/* Registration Area */}
                <section className="registration-area">
                    <Container>
                        <Row>
                            <Col md={12}>
                                <div className="registration-box">
                                    <div className="registration-title text-center">
                                        <h3>Registration</h3>
                                    </div>
                                    <form onSubmit={handleRegister} className="form">
                                        <p className="form-control">
                                            <label style={{ display: 'block', marginBottom: '8px' }}>First Name</label>
                                            <input
                                                type="text"
                                                placeholder="First name"
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            />
                                        </p>
                                        <p className="form-control">
                                            <label style={{ display: 'block', marginBottom: '8px' }}>Last Name</label>
                                            <input
                                                type="text"
                                                placeholder="Last name"
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            />
                                        </p>
                                        <p className="form-control">
                                            <label style={{ display: 'block', marginBottom: '8px' }}>Email Address</label>
                                            <input
                                                type="email"
                                                placeholder="Email address"
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </p>

                                        <p className="form-control">
                                            <label style={{ display: 'block', marginBottom: '8px' }}>Password</label>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="*******"
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                                            <label style={{ display: 'block', marginBottom: '8px' }}>Confirm Password</label>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Confirm password"
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                                        <button type="submit" disabled={isLoading}>
                                            {isLoading ? 'Processing...' : 'Register Now'}
                                        </button>
                                        <div className="have_account-btn text-center">
                                            <p>Already have an account? <Link to="/login">Login Here</Link></p>
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