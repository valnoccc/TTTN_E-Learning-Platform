import { useState, ChangeEvent, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axiosClient from '../../../../api/axios';

export function useInstructorProfile() {
    const [formData, setFormData] = useState({
        TieuSu: '',
        ChuyenMon: '',
        SoTaiKhoan: '',
        FacebookURL: '',
        InstagramURL: '',
        GitHubURL: '',
        WebsiteURL: '',
    });

    // Thêm state để chứa thông tin User cơ bản lấy từ API
    const [initialUser, setInitialUser] = useState({ hoTen: '', anhDaiDien: '' });

    // Tự động gọi API lấy dữ liệu khi Component Mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axiosClient.get<any>('/instructors/me/profile');

                // Xử lý linh hoạt: 
                // Nếu Axios trả về object chuẩn thì dữ liệu nằm trong response.data
                // Nếu Axios có interceptor thì dữ liệu nằm luôn trong response
                const profileData = response.data || response;

                // Nếu hoàn toàn không có dữ liệu thì dừng lại, không lỗi
                if (!profileData) return;

                // Dùng thêm ?. để an toàn tuyệt đối khi đọc property
                setFormData({
                    TieuSu: profileData?.TieuSu || '',
                    ChuyenMon: profileData?.ChuyenMon || '',
                    SoTaiKhoan: profileData?.SoTaiKhoan || '',
                    FacebookURL: profileData?.FacebookURL || '',
                    InstagramURL: profileData?.InstagramURL || '',
                    GitHubURL: profileData?.GitHubURL || '',
                    WebsiteURL: profileData?.WebsiteURL || '',
                });

                // Cập nhật thông tin HoTen, AnhDaiDien
                setInitialUser({
                    hoTen: profileData?.hoTen || '',
                    anhDaiDien: profileData?.anhDaiDien || '',
                });
            } catch (error) {
                console.error('Không thể tải hồ sơ', error);
            }
        };

        void fetchProfile();
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (hoTen: string, anhDaiDien: string) => {
        try {
            const payload = { ...formData, HoTen: hoTen, AnhDaiDien: anhDaiDien };
            await axiosClient.patch('/instructors/me/profile', payload);
            toast.success('Đã lưu hồ sơ thành công!');
        } catch (error) {
            toast.error('Lỗi khi lưu hồ sơ.');
        }
    };

    return { formData, handleChange, handleSave, initialUser };
}