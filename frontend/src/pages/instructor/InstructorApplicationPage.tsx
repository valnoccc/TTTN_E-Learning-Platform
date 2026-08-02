import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosClient from "../../api/axios";

type ApplicationForm = {
  TieuSu: string;
  ChuyenMon: string;
  SoTaiKhoan: string;
  MaNganHang: string;
  TenNganHang: string;
  TenChuTaiKhoan: string;
  BangCaps: BangCapForm[];
  KinhNghiems: KinhNghiemForm[];
  FacebookURL: string;
  InstagramURL: string;
  GitHubURL: string;
  WebsiteURL: string;
};

type BangCapForm = {
  TenTruong: string;
  TenBangCap: string;
  ChuyenNganh: string;
  NamBatDau: string;
  NamKetThuc: string;
};

type KinhNghiemForm = {
  TenDonVi: string;
  ChucVu: string;
  NamBatDau: string;
  NamKetThuc: string;
  DangLamViec: boolean;
  MoTa: string;
};

const initialForm: ApplicationForm = {
  TieuSu: "",
  ChuyenMon: "",
  SoTaiKhoan: "",
  MaNganHang: "",
  TenNganHang: "",
  TenChuTaiKhoan: "",
  BangCaps: [],
  KinhNghiems: [],
  FacebookURL: "",
  InstagramURL: "",
  GitHubURL: "",
  WebsiteURL: "",
};

const socialFields = [
  "FacebookURL",
  "InstagramURL",
  "GitHubURL",
  "WebsiteURL",
] as const;

export default function InstructorApplicationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ApplicationForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("access_token"))
      navigate("/login", { replace: true });
  }, [navigate]);

  const updateField = (field: keyof ApplicationForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const addBangCap = () => {
    setForm((current) => ({
      ...current,
      BangCaps: [...current.BangCaps, { TenTruong: "", TenBangCap: "", ChuyenNganh: "", NamBatDau: "", NamKetThuc: "" }],
    }));
  };

  const addKinhNghiem = () => {
    setForm((current) => ({
      ...current,
      KinhNghiems: [...current.KinhNghiems, { TenDonVi: "", ChucVu: "", NamBatDau: "", NamKetThuc: "", DangLamViec: false, MoTa: "" }],
    }));
  };

  const updateBangCap = (index: number, field: keyof BangCapForm, value: string) => {
    setForm((current) => ({
      ...current,
      BangCaps: current.BangCaps.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  };

  const updateKinhNghiem = (index: number, field: keyof KinhNghiemForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      KinhNghiems: current.KinhNghiems.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  };

  const removeBangCap = (index: number) => {
    setForm((current) => ({ ...current, BangCaps: current.BangCaps.filter((_, itemIndex) => itemIndex !== index) }));
  };

  const removeKinhNghiem = (index: number) => {
    setForm((current) => ({ ...current, KinhNghiems: current.KinhNghiems.filter((_, itemIndex) => itemIndex !== index) }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const applicationPayload = {
        TieuSu: form.TieuSu,
        ChuyenMon: form.ChuyenMon,
        SoTaiKhoan: form.SoTaiKhoan,
        MaNganHang: form.MaNganHang,
        TenNganHang: form.TenNganHang,
        TenChuTaiKhoan: form.TenChuTaiKhoan,
        BangCaps: form.BangCaps.map((item) => ({
          ...item,
          NamBatDau: item.NamBatDau ? Number(item.NamBatDau) : undefined,
          NamKetThuc: item.NamKetThuc ? Number(item.NamKetThuc) : undefined,
        })),
        KinhNghiems: form.KinhNghiems.map((item) => ({
          ...item,
          NamBatDau: item.NamBatDau ? Number(item.NamBatDau) : undefined,
          NamKetThuc: item.NamKetThuc ? Number(item.NamKetThuc) : undefined,
        })),
        ...(form.FacebookURL.trim()
          ? { FacebookURL: form.FacebookURL.trim() }
          : {}),
        ...(form.InstagramURL.trim()
          ? { InstagramURL: form.InstagramURL.trim() }
          : {}),
        ...(form.GitHubURL.trim() ? { GitHubURL: form.GitHubURL.trim() } : {}),
        ...(form.WebsiteURL.trim()
          ? { WebsiteURL: form.WebsiteURL.trim() }
          : {}),
      };
      const response: any = await axiosClient.post(
        "/instructor-applications/me",
        applicationPayload,
      );
      const payload = response?.data ?? response;
      localStorage.setItem("access_token", payload.access_token);
      if (payload.user) {
        localStorage.setItem(
          "user",
          JSON.stringify({ ...payload.user, role: payload.user.vaiTro }),
        );
      }
      window.dispatchEvent(new Event("auth-change"));
      toast.success("Đăng ký giảng viên thành công!");
      navigate("/instructor", { replace: true });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Không thể đăng ký giảng viên. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    minHeight: 50,
    borderColor: "#d7e4dd",
    borderRadius: 10,
  };
  const labelStyle = { color: "#315247", fontWeight: 600 };

  return (
    <main style={{ background: "#f5f8f7", minHeight: "calc(100vh - 140px)" }}>
      <div className="container py-5">
        <div className="mx-auto" style={{ maxWidth: 940 }}>
          <div className="row align-items-end g-4 mb-4">
            <div className="col-lg-8">
              <div
                className="d-flex align-items-center gap-2 mb-3"
                style={{
                  color: "#168a58",
                  letterSpacing: "0.12em",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <span style={{ width: 30, height: 2, background: "#20a464" }} />
                HỒ SƠ GIẢNG VIÊN
              </div>
              <h1
                className="mb-2"
                style={{
                  color: "#132a24",
                  fontSize: "clamp(30px, 4vw, 44px)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                Chia sẻ kiến thức của bạn
              </h1>
              <p
                className="mb-0"
                style={{
                  color: "#657a73",
                  fontSize: 16,
                  maxWidth: 650,
                  lineHeight: 1.7,
                }}
              >
                Hoàn thiện hồ sơ để bắt đầu xây dựng khóa học và đồng hành cùng
                người học trên Edumeo.
              </p>
            </div>
          </div>

          <form
            onSubmit={submit}
            style={{
              background: "#fff",
              border: "1px solid #e0ebe5",
              borderRadius: 18,
              boxShadow: "0 18px 45px rgba(24, 74, 52, 0.08)",
              overflow: "hidden",
            }}
          >
            <div className="p-4 p-md-5">
              <div
                className="d-flex align-items-start gap-3 pb-4 mb-4"
                style={{ borderBottom: "1px solid #edf2ef" }}
              >
                <span
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#effaf4",
                    color: "#168a58",
                    fontSize: 21,
                  }}
                >
                  <i className="las la-user-tie" />
                </span>
                <div>
                  <h2
                    className="h5 mb-1"
                    style={{ color: "#17352a", fontWeight: 700 }}
                  >
                    Thông tin giảng viên
                  </h2>
                  <p
                    className="mb-0"
                    style={{ color: "#7b8e86", fontSize: 14 }}
                  >
                    Các trường có dấu * là bắt buộc.
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div
                  className="d-flex align-items-center gap-2 mb-3"
                  style={{ color: "#17352a", fontWeight: 700 }}
                >
                  <i
                    className="las la-award"
                    style={{ color: "#20a464", fontSize: 20 }}
                  />
                  Chuyên môn của bạn
                </div>
                <div className="row g-4">
                  <div className="col-md-6">
                    <label
                      className="form-label"
                      htmlFor="ChuyenMon"
                      style={labelStyle}
                    >
                      Chuyên môn *
                    </label>
                    <input
                      id="ChuyenMon"
                      className="form-control"
                      value={form.ChuyenMon}
                      required
                      maxLength={255}
                      placeholder="Ví dụ: Lập trình Web, Thiết kế..."
                      style={inputStyle}
                      onChange={(event) =>
                        updateField("ChuyenMon", event.target.value)
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label
                      className="form-label"
                      htmlFor="SoTaiKhoan"
                      style={labelStyle}
                    >
                      Số tài khoản *
                    </label>
                    <input
                      id="SoTaiKhoan"
                      className="form-control"
                      value={form.SoTaiKhoan}
                      required
                      maxLength={50}
                      placeholder="Nhập số tài khoản nhận thanh toán"
                      style={inputStyle}
                      onChange={(event) =>
                        updateField("SoTaiKhoan", event.target.value)
                      }
                    />
                  </div>
                  <div className="col-12 mt-4 pt-4" style={{ borderTop: "1px solid #edf2ef" }}>
                    <div className="d-flex align-items-center gap-2 mb-1" style={{ color: "#17352a", fontWeight: 700 }}>
                      <i className="las la-university" style={{ color: "#20a464", fontSize: 20 }} />
                      Thông tin nhận thanh toán
                    </div>
                    <p className="mb-0" style={{ color: "#7b8e86", fontSize: 14 }}>
                      Nhập chính xác thông tin tài khoản đứng tên bạn để nhận doanh thu khóa học.
                    </p>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="MaNganHang" style={labelStyle}>
                      Mã ngân hàng *
                    </label>
                    <input
                      id="MaNganHang"
                      className="form-control"
                      value={form.MaNganHang}
                      required
                      maxLength={20}
                      placeholder="Ví dụ: VCB, TCB"
                      style={inputStyle}
                      onChange={(event) => updateField("MaNganHang", event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="TenNganHang" style={labelStyle}>
                      Tên ngân hàng *
                    </label>
                    <input
                      id="TenNganHang"
                      className="form-control"
                      value={form.TenNganHang}
                      required
                      maxLength={150}
                      placeholder="Ví dụ: Vietcombank"
                      style={inputStyle}
                      onChange={(event) => updateField("TenNganHang", event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="TenChuTaiKhoan" style={labelStyle}>
                      Chủ tài khoản *
                    </label>
                    <input
                      id="TenChuTaiKhoan"
                      className="form-control"
                      value={form.TenChuTaiKhoan}
                      required
                      maxLength={150}
                      placeholder="Tên đúng như tài khoản ngân hàng"
                      style={inputStyle}
                      onChange={(event) => updateField("TenChuTaiKhoan", event.target.value)}
                    />
                  </div>
                  <div className="col-12 mt-2">
                    <div className="d-flex align-items-center gap-2 mb-3" style={{ color: "#17352a", fontWeight: 700 }}>
                      <i className="las la-align-left" style={{ color: "#20a464", fontSize: 20 }} />
                      Giới thiệu bản thân
                    </div>
                    <label
                      className="form-label"
                      htmlFor="TieuSu"
                      style={labelStyle}
                    >
                      Tiểu sử *
                    </label>
                    <textarea
                      id="TieuSu"
                      className="form-control"
                      rows={5}
                      value={form.TieuSu}
                      required
                      maxLength={500}
                      placeholder="Giới thiệu ngắn về kinh nghiệm, lĩnh vực và điều bạn muốn chia sẻ..."
                      style={{ ...inputStyle, resize: "vertical" }}
                      onChange={(event) =>
                        updateField("TieuSu", event.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #edf2ef", paddingTop: 24 }}>
                <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
                  <div>
                    <div className="d-flex align-items-center gap-2" style={{ color: "#17352a", fontWeight: 700 }}>
                      <i className="las la-graduation-cap" style={{ color: "#20a464", fontSize: 20 }} />
                      Bằng cấp
                    </div>
                    <p className="mb-0 mt-1" style={{ color: "#7b8e86", fontSize: 14 }}>Liệt kê các bằng cấp hoặc chứng chỉ liên quan.</p>
                  </div>
                  <button type="button" className="btn btn-sm" onClick={addBangCap} style={{ color: "#168a58", border: "1px solid #bfe5cd", background: "#effaf4", borderRadius: 8 }}>
                    <i className="las la-plus me-1" /> Thêm bằng cấp
                  </button>
                </div>
                {form.BangCaps.length === 0 ? (
                  <div className="py-3 px-3" style={{ color: "#81938b", background: "#f8fbf9", border: "1px dashed #cfe1d7", borderRadius: 10, fontSize: 14 }}>
                    Chưa có bằng cấp nào. Bạn có thể thêm thông tin sau.
                  </div>
                ) : form.BangCaps.map((item, index) => (
                  <div className="row g-3 p-3 mb-3" key={`qualification-${index}`} style={{ background: "#f8fbf9", border: "1px solid #e3eee8", borderRadius: 12 }}>
                    <div className="col-12 d-flex justify-content-between align-items-center">
                      <small style={{ color: "#168a58", fontWeight: 700 }}>Bằng cấp {index + 1}</small>
                      <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => removeBangCap(index)}>Xóa</button>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={labelStyle}>Trường / tổ chức *</label>
                      <input className="form-control" required value={item.TenTruong} placeholder="Ví dụ: Đại học Bách Khoa" style={inputStyle} onChange={(event) => updateBangCap(index, "TenTruong", event.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={labelStyle}>Bằng cấp / chứng chỉ *</label>
                      <input className="form-control" required value={item.TenBangCap} placeholder="Ví dụ: Cử nhân Công nghệ thông tin" style={inputStyle} onChange={(event) => updateBangCap(index, "TenBangCap", event.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={labelStyle}>Chuyên ngành</label>
                      <input className="form-control" value={item.ChuyenNganh} placeholder="Ví dụ: Khoa học máy tính" style={inputStyle} onChange={(event) => updateBangCap(index, "ChuyenNganh", event.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" style={labelStyle}>Năm bắt đầu</label>
                      <input className="form-control" type="number" min={1900} max={2200} value={item.NamBatDau} style={inputStyle} onChange={(event) => updateBangCap(index, "NamBatDau", event.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label" style={labelStyle}>Năm kết thúc</label>
                      <input className="form-control" type="number" min={1900} max={2200} value={item.NamKetThuc} style={inputStyle} onChange={(event) => updateBangCap(index, "NamKetThuc", event.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #edf2ef", paddingTop: 24, marginTop: 24 }}>
                <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
                  <div>
                    <div className="d-flex align-items-center gap-2" style={{ color: "#17352a", fontWeight: 700 }}>
                      <i className="las la-briefcase" style={{ color: "#20a464", fontSize: 20 }} />
                      Kinh nghiệm
                    </div>
                    <p className="mb-0 mt-1" style={{ color: "#7b8e86", fontSize: 14 }}>Liệt kê các vị trí và nơi bạn đã làm việc.</p>
                  </div>
                  <button type="button" className="btn btn-sm" onClick={addKinhNghiem} style={{ color: "#168a58", border: "1px solid #bfe5cd", background: "#effaf4", borderRadius: 8 }}>
                    <i className="las la-plus me-1" /> Thêm kinh nghiệm
                  </button>
                </div>
                {form.KinhNghiems.length === 0 ? (
                  <div className="py-3 px-3" style={{ color: "#81938b", background: "#f8fbf9", border: "1px dashed #cfe1d7", borderRadius: 10, fontSize: 14 }}>
                    Chưa có kinh nghiệm nào. Bạn có thể thêm thông tin sau.
                  </div>
                ) : form.KinhNghiems.map((item, index) => (
                  <div className="row g-3 p-3 mb-3" key={`experience-${index}`} style={{ background: "#f8fbf9", border: "1px solid #e3eee8", borderRadius: 12 }}>
                    <div className="col-12 d-flex justify-content-between align-items-center">
                      <small style={{ color: "#168a58", fontWeight: 700 }}>Kinh nghiệm {index + 1}</small>
                      <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => removeKinhNghiem(index)}>Xóa</button>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={labelStyle}>Đơn vị / công ty *</label>
                      <input className="form-control" required value={item.TenDonVi} placeholder="Ví dụ: Edumeo" style={inputStyle} onChange={(event) => updateKinhNghiem(index, "TenDonVi", event.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={labelStyle}>Vị trí *</label>
                      <input className="form-control" required value={item.ChucVu} placeholder="Ví dụ: Giảng viên / Technical Lead" style={inputStyle} onChange={(event) => updateKinhNghiem(index, "ChucVu", event.target.value)} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" style={labelStyle}>Năm bắt đầu</label>
                      <input className="form-control" type="number" min={1900} max={2200} value={item.NamBatDau} style={inputStyle} onChange={(event) => updateKinhNghiem(index, "NamBatDau", event.target.value)} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label" style={labelStyle}>Năm kết thúc</label>
                      <input className="form-control" type="number" min={1900} max={2200} value={item.NamKetThuc} disabled={item.DangLamViec} style={inputStyle} onChange={(event) => updateKinhNghiem(index, "NamKetThuc", event.target.value)} />
                    </div>
                    <div className="col-md-4 d-flex align-items-end pb-2">
                      <label className="d-flex align-items-center gap-2" style={{ color: "#315247", fontSize: 14 }}>
                        <input type="checkbox" checked={item.DangLamViec} onChange={(event) => updateKinhNghiem(index, "DangLamViec", event.target.checked)} />
                        Đang làm việc tại đây
                      </label>
                    </div>
                    <div className="col-12">
                      <label className="form-label" style={labelStyle}>Mô tả</label>
                      <textarea className="form-control" rows={3} value={item.MoTa} maxLength={500} placeholder="Mô tả ngắn về vai trò hoặc thành tựu..." style={{ ...inputStyle, resize: "vertical" }} onChange={(event) => updateKinhNghiem(index, "MoTa", event.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #edf2ef", paddingTop: 24, marginTop: 24 }}>
                <div
                  className="d-flex align-items-center gap-2 mb-2"
                  style={{ color: "#17352a", fontWeight: 700 }}
                >
                  <i
                    className="las la-link"
                    style={{ color: "#20a464", fontSize: 20 }}
                  />
                  Liên kết cá nhân
                </div>
                <p className="mb-3" style={{ color: "#7b8e86", fontSize: 14 }}>
                  Thêm các liên kết để học viên hiểu thêm về bạn. Phần này không
                  bắt buộc.
                </p>
                <div className="row g-4">
                  {socialFields.map((field) => (
                    <div className="col-md-6" key={field}>
                      <label
                        className="form-label"
                        htmlFor={field}
                        style={labelStyle}
                      >
                        <i
                          className="las la-external-link-alt me-1"
                          style={{ color: "#91a99e" }}
                        />
                        {field.replace("URL", " URL")}
                      </label>
                      <input
                        id={field}
                        type="url"
                        className="form-control"
                        value={form[field]}
                        maxLength={255}
                        placeholder="https://"
                        style={inputStyle}
                        onChange={(event) =>
                          updateField(field, event.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 px-4 px-md-5 py-4"
              style={{ background: "#f8fbf9", borderTop: "1px solid #edf2ef" }}
            >
              <small style={{ color: "#7b8e86" }}>
                <i className="las la-lock me-1" />
                Thông tin của bạn được bảo mật
              </small>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light px-4"
                  onClick={() => navigate(-1)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn px-4"
                  disabled={submitting}
                  style={{
                    background: "#20a464",
                    borderColor: "#20a464",
                    color: "#fff",
                    fontWeight: 600,
                    borderRadius: 9,
                  }}
                >
                  {submitting ? "Đang lưu..." : "Đăng ký giảng viên"}
                  {!submitting && <i className="las la-arrow-right ms-2" />}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
