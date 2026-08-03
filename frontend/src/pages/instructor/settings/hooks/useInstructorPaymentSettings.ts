import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import axiosClient from '../../../../api/axios';

export type PaymentSettingsForm = {
    SoTaiKhoan: string;
    MaNganHang: string;
    TenNganHang: string;
    TenChuTaiKhoan: string;
};

const initialForm: PaymentSettingsForm = {
    SoTaiKhoan: '',
    MaNganHang: '',
    TenNganHang: '',
    TenChuTaiKhoan: '',
};

export function useInstructorPaymentSettings() {
    const [formData, setFormData] = useState<PaymentSettingsForm>(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await axiosClient.get<any>('/instructors/me/profile');
                const profile = response.data || response;
                setFormData({
                    SoTaiKhoan: profile?.SoTaiKhoan || '',
                    MaNganHang: profile?.MaNganHang || '',
                    TenNganHang: profile?.TenNganHang || '',
                    TenChuTaiKhoan: profile?.TenChuTaiKhoan || '',
                });
            } catch (error) {
                toast.error('Không thể tải thông tin thanh toán.');
            } finally {
                setLoading(false);
            }
        };

        void loadSettings();
    }, []);

    const updateField = (field: keyof PaymentSettingsForm, value: string) => {
        setFormData((current) => ({ ...current, [field]: value }));
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            await axiosClient.patch('/instructors/me/profile', formData);
            toast.success('Đã cập nhật thông tin thanh toán.');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Không thể lưu thông tin thanh toán.');
        } finally {
            setSaving(false);
        }
    };

    return { formData, loading, saving, updateField, saveSettings };
}
