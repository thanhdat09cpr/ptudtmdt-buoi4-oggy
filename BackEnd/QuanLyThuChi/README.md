# Quản lý thu chi cá nhân (Node.js + SQLite)

## Yêu cầu
- Node.js 22.5 trở lên (dùng module `node:sqlite` có sẵn, **không cần `npm install`**)

## Chạy
```
node server.js
```
Mở trình duyệt: http://localhost:3000

Lần chạy đầu tiên tự tạo file `thuchi.db` và dữ liệu mẫu. Muốn làm lại từ đầu: xoá `thuchi.db` rồi chạy lại.

Xem nhanh database: `node xem-database.js` → mở `database-view.html`.

## Cấu trúc
```
QuanLyThuChi/
├── server.js              # Back-end: HTTP server, REST API, kết nối SQLite
├── public/index.html      # Front-end: giao diện (HTML + CSS + JS, gọi API bằng fetch)
├── thuchi.db              # Database SQLite (tự tạo khi chạy)
├── xem-database.js        # Xuất cấu trúc + dữ liệu DB ra database-view.html
└── thiet-ke-he-thong.html # Sơ đồ kiến trúc, ERD, danh sách API
```

## API
| Phương thức | Đường dẫn | Chức năng |
|---|---|---|
| GET | /api/transactions?type=&status=&month=&q= | Danh sách (lọc, tìm kiếm) |
| GET | /api/transactions/:id | Chi tiết |
| POST | /api/transactions | Thêm |
| PUT | /api/transactions/:id | Sửa |
| DELETE | /api/transactions/:id | Xoá |
| PATCH | /api/transactions/:id/status | Cập nhật trạng thái |
| GET | /api/stats?month= | Thống kê |
| GET | /api/categories | Danh mục |
