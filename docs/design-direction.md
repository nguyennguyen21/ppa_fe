# PPA — Design Direction

## 1. Hiện trạng trước khi thay đổi
- Stack: React 19 + TypeScript + Vite 8 + Tailwind CSS v4.
- Bảng màu: stone neutral + amber accent (#d97706), dark mode qua class `.dark`.
- Nhiều trang dùng card lặp lại, hover lift (`-translate-y-0.5`), shadow mạnh, glassmorphism (backdrop-blur) ở navbar.
- Trang phân tích AI hiển thị xác suất lớn (text-5xl) dễ bị hiểu là kết luận chắc chắn.

## 2. Vấn đề đã phát hiện
- Cảm giác template/AI: card đồng nhất, hover lift, shadow mạnh, gradient nền.
- Thiếu restraint: hiệu ứng chuyển động không cần thiết.
- Phân cấp thông tin chưa nhất quán giữa các trang.
- Kết quả AI có thể bị hiểu nhầm là kết luận tuyệt đối.

## 3. Design direction đã chọn
- Phong cách: Technical / Analytical / Academic / Trustworthy.
- Nền trung tính (#f4f3f0 sáng, #0c0b0a tối), chữ stone, một accent amber trầm (#b45309).
- Radius giảm (12px card, 8px button/input), shadow nhẹ, không lift khi hover.
- Không gradient nền, không glassmorphism.
- Kết quả AI: xác suất ước lượng, kèm độ chắc chắn và disclaimer; phân biệt AI / Human / Uncertain / Error.

## 4. Token
- Color: brand, accent, success, warning, danger, info, ai, human, uncertain.
- Radius: card/button/input/badge.
- Shadow: card / card-hover / soft.
- Typography: Be Vietnam Pro (sans), JetBrains Mono (code).

## 5. Đã triển khai
- index.css: token mới, nền đơn sắc, giảm shadow, tắt hover lift toàn cục.
- Navbar: bỏ glassmorphism.
- Layouts: thống nhất nền.
- Button: bỏ hover lift/active scale.
- InfoCard: bỏ hover lift/scale.
- DetectPage: thu nhỏ số xác suất, thêm nhãn "ước lượng" và disclaimer.

## 6. Giữ nguyên nghiệp vụ
- Routing, API, auth, data flow không thay đổi.
- Build + tsc pass.

## 7. Còn tồn tại
- Chưa refactor toàn bộ JSX từng trang (card lặp); đã giảm hiệu ứng qua CSS toàn cục.
- Một số trang vẫn dùng inline style radius/shadow; có thể chuẩn hóa dần.