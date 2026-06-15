export interface CourseDetailsData {
  id: number;
  courseName: string;
  thumbnail: string;
  instructor: string;
  price: number;
  duration: string;
  level: string;
  category: string;
}

export interface CouponResponse {
  valid: boolean;
  couponId: number;
  matchedCourseId: number;
  matchedCourseName: string;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  discountAmount: number;
  message: string;
}

export interface PaymentRequest {
  courseIds: number[];
  paymentMethod: string;
  couponCode?: string;
  customerDetails: {
    fullName: string;
    email: string;
    phone: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  invoiceId: number;
  enrollmentId: number;
}

import axiosClient from './axios';

export const getCourseDetails = async (
  courseId: number,
): Promise<CourseDetailsData> => {
  try {
    const response: any = await axiosClient.get(`/public/courses/${courseId}`);
    return {
      id: parseInt(response.data.maKH),
      courseName: response.data.tenKhoaHoc,
      thumbnail: response.data.hinhThuNho || '/assets/images/course-1.jpg',
      instructor: response.data.giangVien
        ? response.data.giangVien.tenGiangVien ||
          response.data.giangVien.hoTen ||
          'Unknown Instructor'
        : 'Unknown Instructor',
      price: parseFloat(response.data.giaBan || '0'),
      duration: '120 Min',
      level: 'All Levels',
      category: response.data.danhMuc?.tenDM || 'General',
    };
  } catch (error) {
    throw error;
  }
};

export const validateCoupon = async (
  code: string,
  courseIds: number[],
): Promise<CouponResponse> => {
  try {
    const response: any = await axiosClient.post('/coupons/validate', {
      maCode: code,
      courseIds,
    });

    return response?.data ?? response;
  } catch (error) {
    throw error;
  }
};

export const consumeCoupon = async (couponId: number) => {
  try {
    const response: any = await axiosClient.post(`/coupons/${couponId}/consume`);
    return response?.data ?? response;
  } catch (error) {
    throw error;
  }
};

export const processPayment = async (
  data: PaymentRequest,
): Promise<PaymentResponse> => {
  try {
    const response: any = await axiosClient.post('/checkout/process-payment', data);
    return response?.data ?? response;
  } catch (error) {
    throw error;
  }
};

