const mysql = require('mysql2/promise');

async function seed() {
  const connection = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3RAn3h6KN29y4p7.root',
    password: 'h0xekLGgoqzstLim',
    database: 'db_lvtn',
    ssl: {
      rejectUnauthorized: true,
    },
  });

  console.log('Connected to DB');

  // Lấy 1 admin
  const [users] = await connection.execute('SELECT MaND FROM NguoiDung WHERE VaiTro = "ADMIN" LIMIT 1');
  const authorId = users.length > 0 ? users[0].MaND : 1;

  const posts = [
    {
      tieuDe: 'Hướng dẫn lộ trình học Frontend từ Zero đến Hero năm 2026',
      slug: 'lo-trinh-hoc-frontend-2026',
      tomTat: 'Lộ trình chi tiết nhất để trở thành một Frontend Developer chuyên nghiệp. Bao gồm React, Tailwind CSS, và các công cụ AI mới nhất.',
      noiDung: '<h2>Tại sao nên chọn Frontend?</h2><p>Trong thời đại AI phát triển mạnh mẽ, Frontend vẫn đóng vai trò cốt lõi trong việc tạo ra trải nghiệm người dùng tuyệt vời. Đây là cơ hội vàng để các bạn bứt phá.</p><p><img src="https://picsum.photos/seed/frontend/800/400" alt="frontend" /></p><p>Hãy bắt đầu bằng việc nắm vững HTML, CSS và JavaScript trước khi nhảy vào framework như React hay Vue nhé.</p>',
      hinhAnh: 'https://picsum.photos/seed/frontend/800/400',
      category: 'NEWS'
    },
    {
      tieuDe: 'Bản cập nhật hệ thống: Ra mắt tính năng Nhắn tin thời gian thực',
      slug: 'ra-mat-tinh-nang-chat-realtime',
      tomTat: 'Hệ thống vừa được nâng cấp với tính năng Chat Realtime giúp Giảng viên và Học viên tương tác trực tiếp một cách dễ dàng.',
      noiDung: '<h2>Tính năng Chat có gì mới?</h2><p>Dựa trên công nghệ Socket.IO, hệ thống cho phép nhắn tin không độ trễ. Các học viên có thể trao đổi bài tập nhóm ngay trên nền tảng.</p><ul><li>Tốc độ phản hồi tức thì</li><li>Hỗ trợ gửi hình ảnh và file đính kèm</li><li>Giao diện trực quan</li></ul><p>Trải nghiệm ngay hôm nay!</p>',
      hinhAnh: 'https://picsum.photos/seed/chat/800/400',
      category: 'SYSTEM_UPDATE'
    },
    {
      tieuDe: 'Giảm giá 50% tất cả khóa học Lập trình Web nhân dịp Lễ Quốc Khánh',
      slug: 'khuyen-mai-50-quoc-khanh',
      tomTat: 'Cơ hội duy nhất trong năm để sở hữu các khóa học chất lượng với giá siêu hời. Số lượng có hạn!',
      noiDung: '<h2>Mừng Lễ Quốc Khánh!</h2><p>E-Learning Platform xin gửi tặng mã giảm giá <strong>QKH50</strong> giảm trực tiếp 50% cho toàn bộ khóa học lập trình Web (React, Node.js, Vue, PHP).</p><p>Thời gian áp dụng: từ nay đến hết mùng 5 tháng 9.</p><p><strong style="color: red; font-size: 20px;">Đăng ký ngay hôm nay!</strong></p>',
      hinhAnh: 'https://picsum.photos/seed/sale/800/400',
      category: 'PROMOTION'
    },
    {
      tieuDe: 'Kỹ năng giải quyết vấn đề (Problem Solving) cho Developer',
      slug: 'ky-nang-problem-solving-cho-dev',
      tomTat: 'Không chỉ là code, kỹ năng giải quyết vấn đề quyết định sự nghiệp của một lập trình viên. Bài viết chia sẻ 5 bước đơn giản để debug hiệu quả.',
      noiDung: '<h2>1. Đọc và hiểu lỗi (Error logs)</h2><p>Khoảng 80% câu trả lời nằm ngay trong dòng báo lỗi. Hãy đọc thật kỹ trước khi lên mạng hỏi.</p><h2>2. Phân chia để trị (Divide and Conquer)</h2><p>Chia nhỏ vấn đề thành các hàm/module nhỏ hơn để test. Nếu code quá dài, hãy debug từng phần.</p><h2>3. Sử dụng AI</h2><p>Sử dụng AI như một người bạn lập trình cặp (Pair programming) để đưa ra hướng giải quyết nhanh nhất, đừng ngại học cái mới.</p>',
      hinhAnh: 'https://picsum.photos/seed/debug/800/400',
      category: 'NEWS'
    }
  ];

  for (const post of posts) {
    const [existing] = await connection.execute('SELECT MaBV FROM BaiViet WHERE Slug = ?', [post.slug]);
    if (existing.length === 0) {
      await connection.execute(`
        INSERT INTO BaiViet (TieuDe, Slug, TomTat, NoiDung, HinhAnh, TrangThai, MaND_TacGia)
        VALUES (?, ?, ?, ?, ?, 'PUBLISHED', ?)
      `, [post.tieuDe, post.slug, post.tomTat, post.noiDung, post.hinhAnh, authorId]);
      console.log('Inserted:', post.tieuDe);
    } else {
      console.log('Skipped existing:', post.tieuDe);
    }
  }

  await connection.end();
}

seed().catch(console.error);
