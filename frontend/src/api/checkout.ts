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
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
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

// ...

export const getCourseDetails = async (courseId: number): Promise<CourseDetailsData> => {
  try {
    const response: any = await axiosClient.get(`/public/courses/${courseId}`);
    return {
      id: parseInt(response.data.maKH),
      courseName: response.data.tenKhoaHoc,
      thumbnail: response.data.hinhThuNho || '/assets/images/course-1.jpg',
      instructor: response.data.giangVien ? (response.data.giangVien.tenGiangVien || response.data.giangVien.hoTen || 'Unknown Instructor') : 'Unknown Instructor',
      price: parseFloat(response.data.giaBan || '0'),
      duration: '120 Min',
      level: 'All Levels',
      category: response.data.danhMuc?.tenDM || 'General',
    };
  } catch (error) {
    throw error;
  }
};

export const validateCoupon = async (code: string, courseId: number): Promise<CouponResponse> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (code.toUpperCase() === 'SUMMER2026') {
        resolve({
          valid: true,
          discountType: 'PERCENT',
          discountValue: 10,
        });
      } else {
        reject(new Error('Invalid coupon code'));
      }
    }, 800);
  });
};

export const processPayment = async (data: PaymentRequest): Promise<PaymentResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        invoiceId: Math.floor(Math.random() * 10000),
        enrollmentId: Math.floor(Math.random() * 10000),
      });
    }, 2000);
  });
};
