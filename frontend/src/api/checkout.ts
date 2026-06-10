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

// Mock API calls using timeouts to simulate network delay
export const getCourseDetails = async (courseId: number): Promise<CourseDetailsData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: courseId,
        courseName: 'Javascript Programming From Scratch For Beginners To Advanced',
        thumbnail: '/assets/images/course-1.jpg',
        instructor: 'Andy Robert',
        price: 29.0,
        duration: '1 Year',
        level: 'Beginner',
        category: 'Web Development',
      });
    }, 1000);
  });
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
