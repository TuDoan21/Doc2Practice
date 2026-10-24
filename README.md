# 📚 Doc2Practice — AI-Powered Learning Platform
> **Slogan:** *“Từ tài liệu đến thành thạo.”*

**Doc2Practice** là nền tảng học tập thông minh toàn diện, giúp học sinh, sinh viên và người tự học biến mọi tài liệu học tập (**PDF, Word .docx, PowerPoint .pptx, ghi chú văn bản**) thành các bộ đề thi trắc nghiệm 4 phương án, thẻ flashcard lật 3D tương tác và theo dõi tiến độ học tập một cách trực quan, khoa học.

---

## 🌟 Tính Năng Nổi Bật

### 1. 🤖 AI Sinh Câu Hỏi & Flashcard Kép
- **Tích hợp Google Gemini 1.5 Flash (BYOK - Bring Your Own Key):** Hỗ trợ nhập và kiểm tra kết nối API Key trực tiếp ngay tại trang Cài đặt.
- **Hệ thống tạo đề Semantic Offline Fallback:** Khi chưa có API Key, hệ thống tự động sử dụng bộ phân tích từ khóa chuyên sâu để tạo bộ câu hỏi chất lượng cao từ tài liệu học thuật thực tế mà không bị gián đoạn.
- **Tạo đồng thời 2 công cụ học tập:** Mỗi lần tạo đề sẽ sinh ra cả **Bộ trắc nghiệm chấm điểm** và **Bộ Flashcard ôn tập**.

### 2. 📂 Hỗ Trợ Đa Định Dạng & Nhập Văn Bản Trực Tiếp
- **Kéo thả / Chọn tệp:** Hỗ trợ đầy đủ **PDF (`.pdf`)**, **Word (`.docx, .doc`)**, **PowerPoint (`.pptx, .ppt`)**, file text/markdown lên tới 30MB.
- **Nhập nhanh bài giảng / ghi chú:** Chuyển sang tab **"Dán nội dung văn bản"** để dán trực tiếp đoạn tóm tắt bài học, đề cương hoặc nội dung bài giảng.
- **Kho tài liệu mẫu sẵn có:** Có sẵn các file mẫu về *React & TypeScript*, *Lập trình Web*, *Tiếng Anh TOEIC* để trải nghiệm tức thì.

### 3. 🎯 Phòng Luyện Thi Chuyên Nghiệp (Quiz Simulator)
- **2 Chế độ học tập linh hoạt:**
  - **Chế độ Thi thử (Exam Mode):** Tính giờ nghiêm túc, làm xong nộp bài mới biết điểm và lời giải.
  - **Chế độ Ôn luyện (Study Mode):** Chọn câu nào biết ngay đúng/sai tức thì kèm **hộp giải thích chi tiết & mẹo nhớ bài** mở ra ngay bên dưới.
- **Đồng hồ đếm thời gian thực** (Real-time timer).
- **Thanh tiến độ & Đánh dấu câu hỏi (Bookmark):** Đánh dấu câu hỏi cần xem lại và di chuyển nhanh qua thanh điều hướng 20 ô số.
- **Xác nhận nộp bài & Bắn pháo hoa (Confetti):** Thưởng hiệu ứng pháo hoa khi đạt kết quả xuất sắc.
- **Chế độ "Luyện lại chỉ các câu sai":** Tự động lọc các câu làm sai để luyện tập lại ngay lập tức (Targeted Remediation).
- **In ấn & Xuất đề thi:** Nút In phiếu kết quả bài thi hoặc đề thi ra PDF/máy in.

### 4. ⚡ Ngân Hàng Câu Hỏi Sai Toàn Diện (Smart Mistake Bank)
- Tự động thống kê và loại bỏ trùng lặp mọi câu hỏi người học từng làm sai trong lịch sử kiểm tra.
- **1-Click Tạo đề ôn câu sai:** Ngay tại Dashboard và trang Lịch sử, người học chỉ cần bấm nút để tạo ngay một bộ đề ôn tập chuyên biệt nhằm lấp đầy lỗ hổng kiến thức trước kỳ thi thật.

### 5. 📦 Sao Lưu & Chia Sẻ Đa Nền Tảng (Export / Import)
- **Xuất dữ liệu:** Xuất bộ đề thi hoặc Flashcard ra file **JSON** (để sao lưu hoặc chia sẻ cho bạn bè) hoặc file **CSV/TSV chuẩn Anki / Quizlet**.
- **Nhập dữ liệu (Import JSON):** Cho phép nhập bộ đề thi hoặc bộ flashcard từ file JSON bất kỳ vào hệ thống chỉ với một thao tác.

### 6. ⏱️ Đồng Hồ Tập Trung Pomodoro (Focus Pomodoro Tool)
- Tích hợp trực tiếp trên Header: thiết lập chuẩn **25 phút tập trung / 5 phút nghỉ ngơi**.
- Âm thanh báo hiệu nhẹ nhàng bằng Web Audio API khi hoàn thành chu kỳ.
- Tự động đếm và lưu lại số chu kỳ Pomodoro đã hoàn thành trong ngày để duy trì kỷ luật học tập.

### 7. 🎴 Thẻ Ghi Nhớ Flashcard 3D Thông Minh
- **Hiệu ứng lật thẻ 3D mượt mà** với mặt trước (Khái niệm/Thuật ngữ) và mặt sau (Giải thích chi tiết & Ví dụ).
- **Hỗ trợ phím tắt tiện lợi:**
  - `Space`: Lật thẻ
  - `Phím mũi tên phải (→)`: Thẻ kế tiếp
  - `Phím mũi tên trái (←)`: Thẻ trước đó
- **Trộn thẻ ngẫu nhiên (Shuffle)** và **Tự động chạy (Auto-play)** giúp ôn bài rảnh tay.
- **Theo dõi Spaced Repetition:** Phân loại thẻ thành *Đã nhớ* và *Cần ôn lại*, hiển thị thanh tiến độ ghi nhớ theo thời gian thực.
- **Quản lý bộ thẻ:** Thêm thẻ ghi nhớ mới tùy chỉnh hoặc xóa thẻ khỏi bộ.

### 8. 📊 Bảng Thống Kê & Lịch Sử Luyện Tập
- **Dashboard trực quan:** 4 chỉ số cốt lõi (Tài liệu, Bộ câu hỏi, Câu đã làm, Điểm trung bình).
- **Biểu đồ hoạt động 7 ngày (Recharts AreaChart):** Theo dõi tần suất học và biến thiên điểm số.
- **Lịch sử làm bài chi tiết:** Xem lại từng lượt thi, số câu đúng/sai, thời gian làm và mở modal xem lại chi tiết từng câu.

### 9. 🔐 Quản Lý Hồ Sơ & Xác Thực Người Dùng
- **Đăng nhập (`/login`) & Đăng ký (`/register`):** Thiết kế 2 cột chuẩn SaaS hiện đại, kiểm tra email/mật khẩu, thanh đo độ mạnh mật khẩu và modal điều khoản bảo mật.
- **Cơ chế 1-Click Demo:** Đăng nhập tức thì chỉ với một thao tác.
- **Hồ sơ cá nhân (`/app/settings`):** Tùy chỉnh Họ tên, Trường/Tổ chức và chọn 5 bảng màu avatar gradient sang trọng.
- **Đăng xuất an toàn:** Modal xác nhận đăng xuất có mặt ở cả Header và Sidebar.

---

## 🛠️ Công Nghệ Sử Dụng

| Hạng mục | Công nghệ |
| :--- | :--- |
| **Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 8](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com/) (Indigo SaaS theme) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Biểu đồ** | [Recharts](https://recharts.org/) |
| **Hiệu ứng** | [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) |
| **Định tuyến** | [React Router DOM v7](https://reactrouter.com/) |
| **AI Integration** | Google Gemini 1.5 Flash REST API Client + Semantic Offline Parser |
| **Persistence** | LocalStorage Engine v2 với Event Bus đồng bộ realtime |

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu cầu tiên quyết
- **Node.js:** Phiên bản 18 trở lên (khuyên dùng Node 20 hoặc 24 LTS).
- **NPM:** Đi kèm sẵn với Node.js.

### 1. Mở terminal tại thư mục dự án
```powershell
cd d:\Doc2Practice
```

### 2. Cài đặt thư viện phụ thuộc (nếu chưa có)
```powershell
npm.cmd install
```

### 3. Khởi chạy máy chủ phát triển (Development)
```powershell
npm.cmd run dev
```
> Truy cập trình duyệt tại địa chỉ: `http://localhost:5173/`

### 4. Kiểm tra bản build sản xuất (Production Build)
```powershell
npm.cmd run build
npm.cmd run preview
```

---

## 📂 Cấu Trúc Mã Nguồn

```
d:\Doc2Practice\
├── src\
│   ├── components\
│   │   ├── common\           # Navbar, Footer, Sidebar, Header, Modal, Badge, EmptyState
│   │   └── layouts\          # AppLayout, AuthLayout, PublicLayout
│   ├── data\
│   │   └── mockData.ts       # Dữ liệu hạt giống chuẩn (PDF, DOCX, PPTX, câu hỏi, flashcard)
│   ├── pages\
│   │   ├── LandingPage.tsx   # Trang giới thiệu công khai
│   │   ├── LoginPage.tsx     # Đăng nhập & 1-Click Demo
│   │   ├── RegisterPage.tsx  # Đăng ký tài khoản với thanh đo mật khẩu
│   │   ├── DashboardPage.tsx # Bảng điều khiển & Biểu đồ tiến độ Recharts
│   │   ├── CreateQuizPage.tsx# Tải tệp (PDF/DOCX/PPTX) hoặc dán văn bản để sinh đề
│   │   ├── QuizPlayerPage.tsx# Phòng thi: đồng hồ, bookmark, chấm điểm, giải thích, luyện lại câu sai
│   │   ├── QuizSetsPage.tsx  # Quản lý kho đề thi: lọc, tìm kiếm, in ấn, xem trước
│   │   ├── FlashcardPage.tsx # Lật thẻ 3D, auto-play, shuffle, spaced repetition
│   │   ├── DocumentsPage.tsx # Quản lý tài liệu nguồn: PDF, Word, PowerPoint
│   │   ├── HistoryPage.tsx   # Lịch sử bài làm & phân tích chi tiết từng lần thi
│   │   └── SettingsPage.tsx  # Hồ sơ người dùng, cấu hình Gemini API Key & Reset hệ thống
│   ├── services\
│   │   ├── aiService.ts      # Client Google Gemini 1.5 Flash + Semantic Generator
│   │   ├── auth.ts           # Quản lý phiên đăng nhập/đăng ký & avatar
│   │   └── storage.ts        # Storage CRUD engine cho documents, quiz, flashcards, attempts
│   ├── types\
│   │   └── index.ts          # TypeScript Data Contracts
│   ├── App.tsx               # Cấu hình routes React Router
│   ├── main.tsx              # Entry Point
│   └── index.css             # Tailwind directives & CSS 3D Transforms
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 💡 Hướng Dẫn Sử Dụng Nhanh

1. **Khám phá ứng dụng:** Truy cập trang chủ `/` và nhấn **"Bắt đầu học ngay"** hoặc **"Đăng nhập"**.
2. **Đăng nhập nhanh:** Tại màn hình đăng nhập, nhấn nút **"Đăng nhập nhanh bằng tài khoản mẫu"** để vào ngay Bảng điều khiển.
3. **Tạo bài kiểm tra mới:**
   - Vào menu **Tạo câu hỏi**.
   - Chọn tải tệp (`.pdf`, `.docx`, `.pptx`) hoặc bấm tab **"Dán nội dung văn bản"** để paste bài học.
   - Chọn số lượng câu (5, 10, 20), độ khó rồi bấm **"Bắt đầu phân tích & Sinh câu hỏi"**.
4. **Luyện thi:**
   - Chọn đáp án cho từng câu, dùng nút **"Đánh dấu"** với các câu phân vân.
   - Bấm **"Nộp bài"** để xem ngay điểm số, hiệu ứng pháo hoa, đáp án và giải thích chi tiết.
   - Nếu có câu sai, bấm **"Luyện lại chỉ các câu sai"** để củng cố ngay kiến thức hổng.
5. **Kích hoạt Gemini AI thật (Tùy chọn):**
   - Vào menu **Cài đặt** -> mục **Google Gemini API Key**.
   - Nhập API Key của bạn (miễn phí từ Google AI Studio) và bấm **"Kiểm tra kết nối"** -> **"Lưu API Key"**.
   - Mọi lượt tạo câu hỏi tiếp theo sẽ được xử lý trực tiếp bởi mô hình Gemini 1.5 Flash!

---
© 2026 **Doc2Practice** — Nền tảng học tập thông minh từ tài liệu của bạn.
