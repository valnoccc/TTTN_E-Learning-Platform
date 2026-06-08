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
    const [initialUser, setInitialUser] = useState({ hoTen: '', anhDaiDien: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axiosClient.get<any>('/instructors/me/profile');
                const profileData = response.data || response;
                if (!profileData) return;

                setFormData({
                    TieuSu: profileData?.TieuSu || '',
                    ChuyenMon: profileData?.ChuyenMon || '',
                    SoTaiKhoan: profileData?.SoTaiKhoan || '',
                    FacebookURL: profileData?.FacebookURL || '',
                    InstagramURL: profileData?.InstagramURL || '',
                    GitHubURL: profileData?.GitHubURL || '',
                    WebsiteURL: profileData?.WebsiteURL || '',
                });
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

    // THAY ĐỔI: Hàm handleSave nhận thêm tham số file ảnh dạng đối tượng File
    const handleSave = async (hoTen: string, anhDaiDien: string, file: File | null) => {
        try {
            toast.loading('Đang xử lý và lưu hồ sơ...', { id: 'save-profile' });

            // Sử dụng FormData để bọc toàn bộ văn bản và file
            const dataPayload = new FormData();

            // 1. Đưa thông tin cơ bản và các liên kết vào FormData
            dataPayload.append('HoTen', hoTen);
            dataPayload.append('TieuSu', formData.TieuSu);
            dataPayload.append('ChuyenMon', formData.ChuyenMon);
            dataPayload.append('SoTaiKhoan', formData.SoTaiKhoan);
            dataPayload.append('FacebookURL', formData.FacebookURL);
            dataPayload.append('InstagramURL', formData.InstagramURL);
            dataPayload.append('GitHubURL', formData.GitHubURL);
            dataPayload.append('WebsiteURL', formData.WebsiteURL);

            // 2. Nếu người dùng có chọn file mới, đính kèm file vào biến tên là 'file'
            if (file) {
                dataPayload.append('file', file);
            }

            // Gửi duy nhất 1 request PATCH lên server
            await axiosClient.patch('/instructors/me/profile', dataPayload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Đã cập nhật toàn bộ hồ sơ thành công!', { id: 'save-profile' });

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            toast.error('Lỗi khi lưu hồ sơ.', { id: 'save-profile' });
        }
    };

    return { formData, handleChange, handleSave, initialUser };
}