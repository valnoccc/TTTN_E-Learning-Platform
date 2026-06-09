import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Cấu hình ngôn ngữ mẫu
const resources = {
  vi: {
    translation: {
      "Cart": "Giỏ hàng",
      "Product": "Khóa học",
      "Price": "Giá",
      "Action": "Hành động",
      "Subtotal": "Tổng phụ",
      "Cart Summary": "Tóm tắt giỏ hàng",
      "Proceed to checkout": "Tiến hành thanh toán",
      "Grand Total": "Tổng cộng",
      "Remove item": "Xóa mục",
      "Student Profile": "Hồ sơ sinh viên",
      "Personal Info": "Thông tin cá nhân",
      "My Courses": "Khóa học của tôi",
      "Payment History": "Lịch sử thanh toán",
      "Update Profile": "Cập nhật hồ sơ",
      "Name": "Họ và tên",
      "Email": "Email",
      "Phone": "Số điện thoại",
      "Password": "Mật khẩu",
      "Learn Now": "Vào học ngay",
      "Date": "Ngày",
      "Invoice ID": "Mã hóa đơn",
      "Amount": "Số tiền",
      "Status": "Trạng thái",
      "Success": "Thành công",
      "Pending": "Chờ xử lý"
    }
  },
  en: {
    translation: {
      "Cart": "Cart",
      "Product": "Course",
      "Price": "Price",
      "Action": "Action",
      "Subtotal": "Subtotal",
      "Cart Summary": "Cart Summary",
      "Proceed to checkout": "Proceed to checkout",
      "Grand Total": "Grand Total",
      "Remove item": "Remove item",
      "Student Profile": "Student Profile",
      "Personal Info": "Personal Info",
      "My Courses": "My Courses",
      "Payment History": "Payment History",
      "Update Profile": "Update Profile",
      "Name": "Name",
      "Email": "Email",
      "Phone": "Phone",
      "Password": "Password",
      "Learn Now": "Learn Now",
      "Date": "Date",
      "Invoice ID": "Invoice ID",
      "Amount": "Amount",
      "Status": "Status",
      "Success": "Success",
      "Pending": "Pending"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "vi", // Ngôn ngữ mặc định
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
