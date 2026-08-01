import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";
import toast from "react-hot-toast";
import { syncVnpayReturn } from "../../../../api/checkout";
import CourseRecommendations from "./CourseRecommendations";

type Status = "loading" | "success" | "failed";

export default function VnpayReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>("loading");
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  
  const [parsedCourseIds, setParsedCourseIds] = useState<number[]>([]);
  const [parsedUserId, setParsedUserId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const processReturn = async () => {
      try {
        const queryParams: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          queryParams[key] = value;
        });

        const result = await syncVnpayReturn(queryParams);
        if (cancelled) return;

        if (result.success) {
          setStatus("success");
          setInvoiceId(result.invoiceId);
          setAmount(result.amount ?? null);
          setMessage(result.message);
          
          if (result.courseIds && result.courseIds.length > 0) {
            setParsedCourseIds(result.courseIds);
          }
          if (result.userId) {
            setParsedUserId(result.userId);
          }

          localStorage.removeItem("edumeo_cross_sell");
          window.dispatchEvent(new Event("edumeo_cross_sell_updated"));
          toast.success("Thanh toán VNPay thành công!");
        } else {
          setStatus("failed");
          setInvoiceId(result.invoiceId);
          setMessage(result.message || "Thanh toán không thành công.");
          toast.error("Thanh toán VNPay thất bại.");
        }
      } catch (error: any) {
        if (cancelled) return;
        setStatus("failed");
        setMessage(
          error?.response?.data?.message ||
            "Có lỗi xảy ra khi xác thực thanh toán. Vui lòng liên hệ hỗ trợ."
        );
        toast.error("Lỗi xác thực thanh toán VNPay.");
      }
    };
    processReturn();
    return () => { cancelled = true; };
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "100vh", gap: "16px" }}>
        <Spinner animation="border" variant="success" style={{ width: "64px", height: "64px" }} />
        <p className="text-muted fs-5">Đang xác nhận thanh toán VNPay...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="main-wrapper">
        <Container className="py-5">
          <div className="card shadow-sm border-0 mx-auto p-5 text-center" style={{ maxWidth: "560px", borderRadius: "16px" }}>
            <div className="mb-4">
              <i className="las la-check-circle" style={{ fontSize: "80px", color: "#16a34a" }} />
            </div>
            <h2 className="fw-bold mb-3" style={{ color: "#15803d" }}>Thanh toán thành công!</h2>
            {invoiceId && <p className="text-muted mb-1">Mã hóa đơn: <strong>#{invoiceId}</strong></p>}
            {amount !== null && <p className="text-muted mb-1">Số tiền: <strong>{amount.toLocaleString("vi-VN")}đ</strong></p>}
            <p className="text-muted mb-1">Phương thức: <strong>VNPay</strong></p>
            <p className="text-success fw-semibold mt-2 mb-4">{message}</p>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button className="btn btn-success px-4" onClick={() => navigate("/student/my-courses")}>
                <i className="las la-play-circle me-2" />Vào học ngay
              </button>
              <button className="btn btn-outline-secondary px-4" onClick={() => navigate("/student/profile?tab=payments")}>
                Xem lịch sử thanh toán
              </button>
            </div>
          </div>

          {parsedCourseIds.length > 0 && (
            <div className="mt-5">
              <CourseRecommendations
                courseIds={parsedCourseIds}
                courseId={parsedCourseIds[0]}
                userId={parsedUserId || undefined}
              />
            </div>
          )}
        </Container>
      </div>
    );
  }

  return (
    <div className="main-wrapper">
      <Container className="py-5">
        <div className="card shadow-sm border-0 mx-auto p-5 text-center" style={{ maxWidth: "560px", borderRadius: "16px" }}>
          <div className="mb-4">
            <i className="las la-times-circle" style={{ fontSize: "80px", color: "#dc2626" }} />
          </div>
          <h2 className="fw-bold mb-3" style={{ color: "#b91c1c" }}>Thanh toán thất bại</h2>
          {invoiceId && <p className="text-muted mb-1">Mã hóa đơn: <strong>#{invoiceId}</strong></p>}
          <p className="text-danger fw-semibold mt-2 mb-4">{message}</p>
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <button className="btn btn-primary px-4" onClick={() => navigate(-1)}>
              <i className="las la-redo-alt me-2" />Thử lại
            </button>
            <button className="btn btn-outline-secondary px-4" onClick={() => navigate("/")}>
              Về trang chủ
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
