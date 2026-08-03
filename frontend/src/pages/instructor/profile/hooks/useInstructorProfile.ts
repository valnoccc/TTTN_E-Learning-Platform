import { useState, ChangeEvent, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axiosClient from '../../../../api/axios';

export type InstructorQualification = {
    MaBangCap?: number;
    TenTruong: string;
    TenBangCap: string;
    ChuyenNganh: string;
    NamBatDau: string;
    NamKetThuc: string;
};

export type InstructorExperience = {
    MaKinhNghiem?: number;
    TenDonVi: string;
    ChucVu: string;
    NamBatDau: string;
    NamKetThuc: string;
    DangLamViec: boolean;
    MoTa: string;
};

const emptyQualification = (): InstructorQualification => ({
    TenTruong: '',
    TenBangCap: '',
    ChuyenNganh: '',
    NamBatDau: '',
    NamKetThuc: '',
});

const emptyExperience = (): InstructorExperience => ({
    TenDonVi: '',
    ChucVu: '',
    NamBatDau: '',
    NamKetThuc: '',
    DangLamViec: false,
    MoTa: '',
});

export function useInstructorProfile() {
    const [formData, setFormData] = useState({
        TieuSu: '',
        ChuyenMon: '',
        FacebookURL: '',
        InstagramURL: '',
        GitHubURL: '',
        WebsiteURL: '',
        BangCaps: [] as InstructorQualification[],
        KinhNghiems: [] as InstructorExperience[],
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
                    FacebookURL: profileData?.FacebookURL || '',
                    InstagramURL: profileData?.InstagramURL || '',
                    GitHubURL: profileData?.GitHubURL || '',
                    WebsiteURL: profileData?.WebsiteURL || '',
                    BangCaps: (profileData?.bangCaps || []).map((item: any) => ({
                        ...emptyQualification(),
                        ...item,
                        NamBatDau: item.NamBatDau?.toString() || '',
                        NamKetThuc: item.NamKetThuc?.toString() || '',
                    })),
                    KinhNghiems: (profileData?.kinhNghiems || []).map((item: any) => ({
                        ...emptyExperience(),
                        ...item,
                        NamBatDau: item.NamBatDau?.toString() || '',
                        NamKetThuc: item.NamKetThuc?.toString() || '',
                        DangLamViec: Boolean(item.DangLamViec),
                    })),
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
        setFormData((current) => ({ ...current, [e.target.name]: e.target.value }));
    };

    const updateBangCap = (index: number, field: keyof InstructorQualification, value: string) => {
        setFormData((current) => ({
            ...current,
            BangCaps: current.BangCaps.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
        }));
    };

    const updateKinhNghiem = (index: number, field: keyof InstructorExperience, value: string | boolean) => {
        setFormData((current) => ({
            ...current,
            KinhNghiems: current.KinhNghiems.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
        }));
    };

    const addBangCap = () => setFormData((current) => ({ ...current, BangCaps: [...current.BangCaps, emptyQualification()] }));
    const removeBangCap = (index: number) => setFormData((current) => ({ ...current, BangCaps: current.BangCaps.filter((_, itemIndex) => itemIndex !== index) }));
    const addKinhNghiem = () => setFormData((current) => ({ ...current, KinhNghiems: [...current.KinhNghiems, emptyExperience()] }));
    const removeKinhNghiem = (index: number) => setFormData((current) => ({ ...current, KinhNghiems: current.KinhNghiems.filter((_, itemIndex) => itemIndex !== index) }));

    // THAY ĐỔI: Hàm handleSave nhận thêm tham số file ảnh dạng đối tượng File
    const handleSave = async (hoTen: string, anhDaiDien: string, file: File | null) => {
        try {
            toast.loading('Đang xử lý và lưu hồ sơ...', { id: 'save-profile' });

            const dataPayload = new FormData();

            // 1. Đưa các trường dữ liệu text vào gói tin
            dataPayload.append('HoTen', hoTen);
            dataPayload.append('TieuSu', formData.TieuSu);
            dataPayload.append('ChuyenMon', formData.ChuyenMon);
            dataPayload.append('FacebookURL', formData.FacebookURL);
            dataPayload.append('InstagramURL', formData.InstagramURL);
            dataPayload.append('GitHubURL', formData.GitHubURL);
            dataPayload.append('WebsiteURL', formData.WebsiteURL);
            dataPayload.append('BangCaps', JSON.stringify(formData.BangCaps));
            dataPayload.append('KinhNghiems', JSON.stringify(formData.KinhNghiems));

            // 2. XỬ LÝ QUAN TRỌNG: 
            // Nếu người dùng chọn file ảnh mới, đính kèm file thật vào trường 'file'
            if (file) {
                dataPayload.append('file', file);
            } else {
                // Nếu không chọn file mới, giữ nguyên URL ảnh cũ từ DB gửi lên
                dataPayload.append('AnhDaiDien', anhDaiDien);
            }

            // Gửi request PATCH gộp duy nhất lên server
            await axiosClient.patch('/instructors/me/profile', dataPayload, { headers: { 'Content-Type': 'multipart/form-data' } });

            toast.success('Đã cập nhật toàn bộ hồ sơ thành công!', { id: 'save-profile' });

            // Chờ 1 giây để đảm bảo DB đã ghi nhận xong rồi mới reload trang
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Lỗi lưu hồ sơ:', error);
            toast.error('Lỗi khi lưu hồ sơ.', { id: 'save-profile' });
        }
    };

    return {
        formData,
        handleChange,
        handleSave,
        initialUser,
        updateBangCap,
        updateKinhNghiem,
        addBangCap,
        removeBangCap,
        addKinhNghiem,
        removeKinhNghiem,
    };
}
