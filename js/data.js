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

  // Mỗi nhà: địa chỉ + các lễ tổ chức tại nhà đó.
  // `map`: link Google Maps chỉ đường (nếu có); không có thì tìm theo `address`
  families: [
    {
      side: 'Nhà trai',
      father: 'Trần Phi Hùng',
      mother: 'Nguyễn Thị Thủy',
      child: { role: 'Chú rể', name: 'Trần Văn Doanh' },
      address: 'Xóm 1, Hải Sơn (cũ)',
      events: [
        { time: '15:30', title: 'Lễ thành hôn', date: 'Thứ Bảy, 14/11' }
      ]
    },
    {
      side: 'Nhà gái',
      father: 'Nguyễn Văn Toàn',
      mother: 'Trần Thị Nguyệt',
      child: { role: 'Cô dâu', name: 'Nguyễn Thị Luyến' },
      address: 'Xóm 8, Hải Tây (cũ)',
      events: [
        { time: '14:30', title: 'Lễ dạm ngõ', date: 'Thứ Sáu, 13/11' },
        { time: '14:30', title: 'Lễ xin dâu', date: 'Thứ Bảy, 14/11' }
      ]
    }
  ],

  // Album: ảnh trong images/anh chon → scripts/convert_webp.py → images/al-xx-800/-1600/-3200.webp
  // w/h = kích thước bản -3200 (để xếp lưới & phóng to không bị nhảy)
  // Sổ lời chúc: URL "Ứng dụng web" của Google Apps Script (xem scripts/guestbook.gs). Để trống = chưa kết nối.
  guestbookUrl: '',

  // Kiểu hiển thị Album: 'justified' | 'magazine' | 'chapters' | 'slideshow' | 'zoom' | 'stack' | 'ring'
  // (mở trang với ?chon để thử từng kiểu trước khi chốt)
  albumLayout: 'magazine',
  // Ảnh nổi bật cho kiểu 'zoom' (7 ảnh đầu, ảnh 1 ở giữa; ảnh 3 nên là ảnh dọc) và 'stack'
  albumHighlights: ['al-08', 'al-12', 'al-13', 'al-17', 'al-07', 'al-21', 'al-01', 'al-04'],
  // Chương ảnh cho kiểu 'chapters'; `feat: true` = ảnh lớn (kiểu tạp chí / ảnh mở chương)
  albumChapters: [
    { key: 'lop', title: 'Lớp học 31.10' },
    { key: 'hanh', title: 'Hành lang' },
    { key: 'hoa', title: 'Hoa xanh' }
  ],
  galleries: [
    {
      key: 'album',
      title: 'Album',
      photos: [
        { id: 'images/al-01', w: 3200, h: 2133, g: 'hanh' },
        { id: 'images/al-02', w: 2410, h: 3615, g: 'hanh' },
        { id: 'images/al-03', w: 2656, h: 3984, g: 'lop' },
        { id: 'images/al-04', w: 3200, h: 2133, g: 'hoa' },
        { id: 'images/al-05', w: 3200, h: 1799, g: 'hanh' },
        { id: 'images/al-06', w: 3200, h: 1800, g: 'lop' },
        { id: 'images/al-07', w: 3200, h: 1800, g: 'lop' },
        { id: 'images/al-08', w: 3200, h: 1800, g: 'lop', feat: true },
        { id: 'images/al-09', w: 3200, h: 1800, g: 'lop' },
        { id: 'images/al-10', w: 3200, h: 1799, g: 'lop' },
        { id: 'images/al-11', w: 3200, h: 1800, g: 'lop' },
        { id: 'images/al-12', w: 3200, h: 1800, g: 'hanh', feat: true },
        { id: 'images/al-13', w: 2236, h: 3972, g: 'hanh' },
        { id: 'images/al-14', w: 2178, h: 3872, g: 'hanh' },
        { id: 'images/al-15', w: 3200, h: 1800, g: 'hanh' },
        { id: 'images/al-16', w: 3200, h: 1800, g: 'hanh' },
        { id: 'images/al-17', w: 3200, h: 1800, g: 'hoa', feat: true },
        { id: 'images/al-18', w: 3200, h: 1799, g: 'hoa' },
        { id: 'images/al-19', w: 3200, h: 1800, g: 'hoa' },
        { id: 'images/al-20', w: 3200, h: 1800, g: 'hoa' },
        { id: 'images/al-21', w: 3200, h: 1800, g: 'hoa' },
        { id: 'images/al-22', w: 3200, h: 1800, g: 'hoa' }
      ]
    }
  ]
};
