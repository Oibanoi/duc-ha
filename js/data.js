/*
 * Toàn bộ nội dung của trang nằm ở đây.
 * Thêm ảnh mới:
 *   python3 scripts/convert_webp.py "Ảnh.zip" -o images
 * rồi thay `id` bằng đường dẫn KHÔNG có đuôi, ví dụ id: 'images/dl-01'.
 * Website tự chọn dl-01-800 / -1600 / -3200.webp tuỳ màn hình; khi xem
 * toàn màn hình trên máy tính/retina sẽ tải bản 3200px.
 * (Muốn dùng 1 file duy nhất thì ghi đủ đuôi, ví dụ 'images/anh.webp'.)
 */
window.WEDDING = {
  groom: { short: 'Văn Doanh', full: 'Trần Văn Doanh', initial: 'D' },
  bride: { short: 'Thị Luyến', full: 'Nguyễn Thị Luyến', initial: 'L' },

  // Mốc đếm ngược: Lễ Thành Hôn
  date: '2026-11-14T15:30:00+07:00',
  dateShort: '14.11.2026',
  dateLong: 'Thứ Bảy, ngày 14 tháng 11 năm 2026',
  lunar: 'Tức ngày 06 tháng 10 năm Bính Ngọ',

  // `map`: link Google Maps chỉ đường; không có thì tìm theo `address`
  families: [
    {
      side: 'Nhà Trai',
      father: 'Trần Phi Hùng',
      mother: 'Nguyễn Thị Thủy',
      child: { role: 'Chú rể', name: 'Trần Văn Doanh' },
      events: [
        { time: '15:30', title: 'Lễ Thành Hôn · 14/11', place: 'Tư gia nhà trai', address: 'Xóm 1, Hải Sơn (cũ)' }
      ]
    },
    {
      side: 'Nhà Gái',
      father: 'Nguyễn Văn Toàn',
      mother: 'Trần Thị Nguyệt',
      child: { role: 'Cô dâu', name: 'Nguyễn Thị Luyến' },
      events: [
        { time: '14:30', title: 'Lễ Dạm Ngõ · 13/11', place: 'Tư gia nhà gái', address: 'Xóm 8, Hải Tây (cũ)' },
        { time: '14:30', title: 'Lễ Xin Dâu · 14/11', place: 'Tư gia nhà gái', address: 'Xóm 8, Hải Tây (cũ)' }
      ]
    }
  ],

  // Ảnh do scripts/convert_webp.py tạo trong images/ (dl-xx-800/-1600/-3200.webp)
  // Hiển thị dạng chồng ảnh polaroid; `land: true` = ảnh ngang
  galleries: [
    {
      key: 'album',
      title: 'Khoảnh khắc',
      photos: [
        { id: 'images/dl-03', cap: 'Đoá hồng xanh' },
        { id: 'images/dl-08', cap: 'Hành lang nắng' },
        { id: 'images/dl-10', cap: 'Lời thì thầm', land: true },
        { id: 'images/dl-01', cap: 'Trước cổng trường' },
        { id: 'images/dl-09', cap: 'Bên hàng cột', land: true },
        { id: 'images/dl-02', cap: 'Bậc thềm quen' },
        { id: 'images/dl-07', cap: 'Lớp học ngày 31.10', land: true },
        { id: 'images/dl-04', cap: 'Tay trong tay' },
        { id: 'images/dl-06', cap: 'Bên khóm hoa vàng', land: true },
        { id: 'images/dl-05', cap: 'Giữa vườn hoa' }
      ]
    }
  ]
};
