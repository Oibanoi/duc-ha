/*
 * Toàn bộ nội dung của trang nằm ở đây.
 * Thêm ảnh mới:
 *   python3 scripts/convert_webp.py "Ảnh.zip" -o images
 * rồi thay `id` bằng đường dẫn KHÔNG có đuôi, ví dụ id: 'images/IMG_6519'.
 * Website tự chọn IMG_6519-800 / -1600 / -3200.webp tuỳ màn hình; khi xem
 * toàn màn hình trên máy tính/retina sẽ tải bản 3200px.
 * (Muốn dùng 1 file duy nhất thì ghi đủ đuôi, ví dụ 'images/anh.webp'.)
 */
window.WEDDING = {
  groom: { short: 'Xuân Dục', full: 'Trần Xuân Dục', initial: 'D' },
  bride: { short: 'Thu Hà', full: 'Lê Thu Hà', initial: 'H' },

  date: '2026-10-18T10:00:00+07:00',
  dateShort: '18.10.2026',
  dateLong: 'Chủ Nhật, ngày 18 tháng 10 năm 2026',
  lunar: 'Tức ngày 09 tháng 09 năm Bính Ngọ',

  // `map`: link Google Maps chỉ đường; không có thì tìm theo `address`
  families: [
    {
      side: 'Nhà Trai',
      father: 'Trần Quốc Toản',
      mother: 'Phạm Thị Tám',
      child: { role: 'Chú rể', name: 'Trần Xuân Dục' },
      events: [
        { time: '10:00', title: 'Tiệc mời cỗ', place: 'Tư gia nhà trai', address: 'Thôn Trà Trung, Xã Hải Hưng, Tỉnh Ninh Bình', map: 'https://maps.app.goo.gl/ymt3UWuGMjnRz5jj8' },
        { time: '13:10', title: 'Lễ Thành Hôn', place: 'Tư gia nhà trai', address: 'Xóm 3, Xã Hải Hưng, Tỉnh Ninh Bình', map: 'https://maps.app.goo.gl/ymt3UWuGMjnRz5jj8' }
      ]
    },
    {
      side: 'Nhà Gái',
      father: 'Lê Thanh Hóa',
      mother: 'Vũ Thị Đào',
      child: { role: 'Cô dâu', name: 'Lê Thu Hà' },
      events: [
        { time: '10:00', title: 'Tiệc mời cỗ', place: 'Tư gia nhà gái', address: 'Thôn Hội Khê, Xã Hải Hưng, Tỉnh Ninh Bình', map: 'https://maps.app.goo.gl/jAY9m7FCu2evBTri9' },
        { time: '13:15', title: 'Lễ Vu Quy', place: 'Tư gia nhà gái', address: 'Thôn Hội Khê, Xã Hải Hưng, Tỉnh Ninh Bình', map: 'https://maps.app.goo.gl/jAY9m7FCu2evBTri9' }
      ]
    }
  ],

  // Ảnh do scripts/convert_webp.py tạo trong images/ (IMG_xxxx-800/-1600/-3200.webp)
  galleries: [
    {
      key: 'phim-truong',
      title: 'Phim Trường',
      cover: 'images/IMG_6485',
      photos: [
        { id: 'images/IMG_6480', cap: 'Dạo bước trong vườn' },
        { id: 'images/IMG_6485', cap: 'Bên mái vòm' },
        { id: 'images/IMG_6498', cap: 'Đài phun nước' },
        { id: 'images/IMG_6476', cap: 'Tay trong tay' },
        { id: 'images/IMG_6475', cap: 'Giữa khu vườn' },
        { id: 'images/IMG_6456', cap: 'Ánh nhìn' },
        { id: 'images/IMG_6481', cap: 'Nhẫn cưới' },
        { id: 'images/IMG_6478', cap: 'Xin chào' },
        { id: 'images/IMG_6477', cap: 'Thì thầm' },
        { id: 'images/IMG_6497', cap: 'Dưới tấm voan' },
        { id: 'images/IMG_6499', cap: 'Lối nhỏ' },
        { id: 'images/IMG_6500', cap: 'Hàng cây xanh' },
        { id: 'images/IMG_6501', cap: 'Bên nhau' }
      ]
    },
    {
      key: 'studio',
      title: 'Studio',
      cover: 'images/IMG_6513',
      photos: [
        { id: 'images/IMG_6503', cap: 'Váy cưới' },
        { id: 'images/IMG_6513', cap: 'Tấm voan dài' },
        { id: 'images/IMG_6515', cap: 'Khiêu vũ' },
        { id: 'images/IMG_6504', cap: 'Vẫy chào' },
        { id: 'images/IMG_6509', cap: 'Niềm vui' },
        { id: 'images/IMG_6514', cap: 'Chỉnh cà vạt' },
        { id: 'images/IMG_6510', cap: 'Nụ cười' },
        { id: 'images/IMG_6512', cap: 'Tinh nghịch' },
        { id: 'images/IMG_6518', cap: 'Giữa hoa' },
        { id: 'images/IMG_6519', cap: 'Khoảnh khắc vui' }
      ]
    },
    {
      key: 'ao-dai',
      title: 'Áo Dài',
      cover: 'images/IMG_6516',
      photos: [
        { id: 'images/IMG_6516', cap: 'Áo dài' },
        { id: 'images/IMG_6517', cap: 'Song hỷ' }
      ]
    }
  ]
};
