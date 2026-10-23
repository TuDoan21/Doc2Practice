# 📚 Doc2Practice — AI-Powered Learning Platform
> **Slogan:** *“Từ tài liệu đến thành thạo.”*

**Doc2Practice** là nền tảng web hiện đại giúp người dùng chuyển đổi tài liệu học tập (PDF, giáo trình, bài giảng) thành các bài trắc nghiệm thông minh, flashcard lật thẻ 3D và theo dõi tiến độ ôn tập một cách chủ động (Active Recall & Spaced Repetition).

---

## 🚀 Công nghệ sử dụng
- **Core Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS (bảng màu Indigo / Modern SaaS)
- **Biểu đồ & Thống kê:** Recharts
- **Icon hệ thống:** Lucide Icons
- **Hiệu ứng trực quan:** Canvas Confetti khi nộp bài điểm cao
- **Lưu trữ dữ liệu MVP:** LocalStorage Persistence Engine (sẵn sàng kết nối Supabase Backend & Gemini API)

---

## 🎯 Các trang và chức năng đã hoàn thành

### 1. Landing Page (`/`)
- **Hero Section:** Tiêu đề ấn tượng *“Biến tài liệu thành bài luyện tập của riêng bạn”*, slogan, các chỉ số cốt lõi và nút CTA điều hướng.
- **Xem trước tương tác (App Mockup):** Minh họa trực quan câu hỏi trắc nghiệm sinh ra từ tài liệu.
- **Quy trình 4 bước:** *Tải tài liệu PDF → Tạo câu hỏi → Luyện tập & Thi thử → Theo dõi tiến độ*.
- **Tính năng nổi bật:** Trắc nghiệm phân loại, Flashcard 3D, giải thích chi tiết từng câu.
- **Thanh điều hướng & Footer:** Đầy đủ liên kết và thông tin bản quyền.

### 2. Dashboard tổng quan (`/app/dashboard`)
- **4 Thẻ thống kê động:** Số tài liệu đã lưu, số bộ câu hỏi, tổng số câu đã làm, điểm trung bình.
- **Biểu đồ tiến độ (Recharts):** Biểu đồ AreaChart trực quan thể hiện tần suất luyện tập và điểm số trong 7 ngày qua.
- **Danh sách gần đây:** Các bộ câu hỏi gần nhất kèm điểm thi và danh sách tài liệu PDF đã nạp.
- **Thao tác nhanh:** Nút nổi bật *“Tạo bộ câu hỏi mới”* mở modal hoặc chuyển trang.

### 3. Tạo bộ câu hỏi (`/app/create-quiz`)
- **Kéo thả / Chọn tệp đa định dạng:** Hỗ trợ đầy đủ **PDF (.pdf)**, tài liệu **Word (.docx, .doc)** và slide thuyết trình **PowerPoint (.pptx, .ppt)** với dung lượng lên đến 30MB.
- **Hỗ trợ chọn file mẫu nhanh:** Có sẵn các tài liệu mẫu gồm PDF, Word và PowerPoint để test ngay lập tức mà không cần chuẩn bị file.
- **Cấu hình bài luyện tập:**
  - Chọn số câu hỏi: **5, 10, 20 câu**.
  - Chọn mức độ khó: **Dễ, Trung bình, Khó**.
  - Chọn dạng câu hỏi: **Trắc nghiệm 4 đáp án**.
- **Mô phỏng AI trực quan:** Hiển thị từng bước xử lý (*Tải lên → Đọc tài liệu PDF/Word/PowerPoint → Trích xuất kiến thức → Sinh câu hỏi kèm giải thích*) và ghi chú rõ ràng đây là bản Demo Preview.
- **Kết quả:** Tự động tạo bộ đề và chuyển hướng sang làm bài ngay lập tức.

### 4. Trang làm bài trắc nghiệm (`/app/quiz/:id`)
- **Giao diện thi chuyên nghiệp:** Đồng hồ đếm thời gian, thanh tiến độ hoàn thành, thanh nhảy nhanh đến câu hỏi bất kỳ.
- **Câu hỏi & 4 phương án (A, B, C, D):** Trạng thái chọn rõ ràng, cho phép chuyển câu Trước / Tiếp theo.
- **Nộp bài & Modal xác nhận:** Cảnh báo nếu còn câu hỏi chưa chọn đáp án.
- **Màn hình kết quả tổng kết:**
  - Thẻ điểm số tổng quan kèm pháo hoa chúc mừng nếu đạt điểm cao (≥ 80%).
  - **Bộ lọc thông minh:** Xem tất cả / Chỉ xem câu sai / Chỉ xem câu đúng.
  - **Chi tiết từng câu:** Hiển thị đáp án đã chọn, đáp án chính xác (highlight xanh) và **hộp giải thích chi tiết** lý do đúng/sai.
  - Nút *“Làm lại bài này”* hoặc *“Về danh sách đề thi”*.

### 5. Kho bộ câu hỏi (`/app/quiz-sets`)
- Hiển thị danh sách bộ câu hỏi dạng thẻ card với đầy đủ thông tin: Tên đề, tài liệu nguồn, số câu, độ khó, điểm thi gần nhất.
- **Tìm kiếm & Bộ lọc:** Tìm kiếm thời gian thực theo từ khóa, lọc theo độ khó, sắp xếp theo *Mới nhất / Điểm cao / Số câu hỏi*.
- **Modal xem trước:** Cho phép xem danh sách tất cả các câu hỏi trong đề trước khi làm bài.

### 6. Thẻ Flashcard ghi nhớ (`/app/flashcards`)
- Giao diện thẻ 3D lật mặt trước (khái niệm/câu hỏi) và mặt sau (định nghĩa/ví dụ).
- **Đánh giá mức độ nhớ:** Nút *“Chưa nhớ”* và *“Đã nhớ”* cập nhật ngay thanh tiến độ ghi nhớ.
- **Chuyển đổi bộ thẻ:** Dễ dàng đổi qua lại giữa các chủ đề học tập.
- **Hỗ trợ phím tắt:**
  - Phím <kbd>Space</kbd>: Lật thẻ
  - Phím <kbd>→</kbd>: Thẻ tiếp theo
  - Phím <kbd>←</kbd>: Thẻ trước đó

### 7. Quản lý tài liệu (`/app/documents`) & Lịch sử (`/app/history`)
- Quản lý các file tài liệu đã tải, tạo đề thi mới trực tiếp từ tài liệu chỉ với 1 click.
- Lịch sử ghi lại từng lượt thi, số câu đúng, thời gian làm và điểm số tích lũy.

### 8. Xác thực người dùng (`/login` & `/register`)
- **Bố cục 2 cột SaaS hiện đại:**
  - Bên trái: Biểu mẫu đăng nhập / đăng ký tối giản, sạch sẽ.
  - Bên phải: Khu vực minh họa *“Biến tài liệu thành lợi thế học tập”* với 3 lợi ích cốt lõi và thẻ kết quả học tập.
- **Trang Đăng nhập (`/login`):** Email, mật khẩu (nút hiện/ẩn mật khẩu), checkbox ghi nhớ, modal khôi phục mật khẩu, nút đăng nhập nhanh 1-Click Demo và nút Google OAuth kèm trạng thái thông báo.
- **Trang Đăng ký (`/register`):** Họ tên, email, mật khẩu, xác nhận mật khẩu, thanh đo độ mạnh mật khẩu trực quan kèm checklist tiêu chí, checkbox cam kết Điều khoản & Quyền riêng tư (có modal xem tóm tắt).
- **Validation toàn diện bằng tiếng Việt:** Kiểm tra định dạng email, độ dài mật khẩu, khớp mật khẩu và ngăn gửi form khi chưa đồng ý điều khoản.

### 9. Cài đặt hệ thống (`/app/settings`)
- Cấu hình thông tin người học, trường nhập Gemini API Key (sẵn sàng cho chế độ BYOK - Bring Your Own Key).
- Nút *“Đặt lại toàn bộ dữ liệu mẫu”* giúp khôi phục hệ thống về trạng thái ban đầu bất cứ lúc nào.

---

## 💻 Hướng dẫn cài đặt và chạy trên máy Local

### Yêu cầu môi trường
- **Node.js:** Phiên bản 18+ (khuyên dùng Node 20 hoặc 24)
- **Trình quản lý gói:** `npm`

### Các bước thực hiện

1. **Mở terminal tại thư mục dự án:**
   ```bash
   cd d:\Doc2Practice
   ```

2. **Cài đặt các gói phụ thuộc (nếu chưa cài):**
   ```bash
   npm install
   ```

3. **Chạy ứng dụng ở môi trường phát triển (Development):**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ khởi chạy tại: `http://localhost:5173/`

4. **Kiểm tra bản build sản phẩm (Production Build):**
   ```bash
   npm run build
   npm run preview
   ```

---

## 🧭 Cấu trúc mã nguồn

```
d:\Doc2Practice\
├── src\
│   ├── assets\             # Hình ảnh & SVG assets
│   ├── components\
│   │   ├── common\         # Navbar, Footer, Sidebar, Header, Modal, Badge, EmptyState
│   │   └── layouts\        # PublicLayout, AppLayout
│   ├── data\
│   │   └── mockData.ts     # Dữ liệu mẫu chuẩn về CNTT, Quản trị, Tiếng Anh
│   ├── pages\
│   │   ├── LandingPage.tsx     # Trang chủ giới thiệu
│   │   ├── DashboardPage.tsx   # Tổng quan & Biểu đồ tiến độ
│   │   ├── CreateQuizPage.tsx  # Tải PDF & Cấu hình sinh câu hỏi
│   │   ├── QuizPlayerPage.tsx  # Giao diện làm bài thi & Xem giải thích
│   │   ├── QuizSetsPage.tsx    # Kho bộ câu hỏi & Bộ lọc
│   │   ├── FlashcardPage.tsx   # Ôn tập thẻ Flashcard 3D
│   │   ├── DocumentsPage.tsx   # Danh sách tài liệu PDF
│   │   ├── HistoryPage.tsx     # Lịch sử bài làm
│   │   └── SettingsPage.tsx    # Cài đặt & Khôi phục dữ liệu
│   ├── services\
│   │   └── storage.ts      # Quản lý LocalStorage & Engine mô phỏng sinh câu hỏi
│   ├── types\
│   │   └── index.ts        # TypeScript Interfaces & Types
│   ├── App.tsx             # Định tuyến React Router
│   ├── index.css           # Cấu hình Tailwind directives & hiệu ứng 3D
│   └── main.tsx            # Entry point
├── tailwind.config.js      # Cấu hình giao diện & theme màu Indigo
├── package.json
└── README.md
```

---

## 🔮 Lộ trình phát triển tiếp theo (Next Steps)
1. **Kết nối Google Gemini API:** Thay thế hàm mô phỏng trong `storage.ts` bằng endpoint backend gọi Gemini 1.5 Flash / Pro để phân tích trực tiếp văn bản PDF.
2. **Tích hợp Supabase:**
   - Supabase Auth: Đăng nhập Google / Email.
   - Supabase Storage: Lưu trữ file PDF an toàn trên cloud bucket.
   - Supabase Database: Lưu trữ bảng `documents`, `quiz_sets`, `questions`, `attempts`.

## 🔮 Lộ trình phát triển tiếp theo (Next Steps)
1. **Kết nối Google Gemini API:** Thay thế hàm mô phỏng trong `storage.ts` bằng endpoint backend gọi Gemini 1.5 Flash / Pro để phân tích trực tiếp văn bản PDF.
2. **Tích hợp Supabase:**
   - Supabase Auth: Đăng nhập Google / Email.
   - Supabase Storage: Lưu trữ file PDF an toàn trên cloud bucket.
   - Supabase Database: Lưu trữ bảng `documents`, `quiz_sets`, `questions`, `attempts`.

