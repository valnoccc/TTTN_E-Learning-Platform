import { useState, ChangeEvent } from 'react';
import { toast } from 'react-hot-toast';

// Giả định bạn có axiosClient đã cấu hình
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

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            // Thay thế bằng endpoint API thực tế của bạn
            await axiosClient.patch('/instructor/profile', formData);
            toast.success('Đã lưu hồ sơ thành công!');
        } catch (error) {
            toast.error('Lỗi khi lưu hồ sơ.');
        }
    };

    return {
        formData,
        handleChange,
        handleSave
    };
}