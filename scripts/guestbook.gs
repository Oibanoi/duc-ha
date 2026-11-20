/** @OnlyCurrentDoc */
/**
 * Sổ lời chúc cho thiệp cưới — Google Apps Script (dán vào Google Sheets).
 *
 * Cài đặt (làm 1 lần):
 *  1. Tạo 1 Google Sheets mới (ví dụ "Lời chúc Doanh & Luyến").
 *  2. Menu Tiện ích mở rộng (Extensions) → Apps Script. Xoá code mẫu, dán toàn bộ file này, bấm Lưu.
 *  3. Bấm Triển khai (Deploy) → Tùy chọn triển khai mới (New deployment) → loại "Ứng dụng web" (Web app):
 *       - Thực thi với tư cách (Execute as): Tôi (Me)
 *       - Người có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
 *     Bấm Triển khai, cấp quyền khi được hỏi, rồi chép "URL ứng dụng web" (kết thúc bằng /exec).
 *  4. Dán URL đó vào `guestbookUrl` trong js/data.js.
 *
 * Quản lý: mỗi lời chúc là 1 dòng trong trang tính của sổ đó.
 *  - Muốn ẩn 1 lời chúc: gõ x vào cột "Ẩn". Muốn xoá hẳn: xoá dòng.
 *  - Sửa code xong phải Triển khai → Quản lý triển khai → sửa → Phiên bản mới, thì web mới nhận code mới
 *    (URL /exec giữ nguyên).
 *
 * Nhiều sổ trên cùng 1 URL: trang gửi tham số `book` (GET: ?book=tix3, POST: {"book":"tix3"}).
 *  - Không có `book` → sổ "loichuc" (thiệp cưới Doanh & Luyến), như trước.
 *  - book=tix3 → trang tính "TIX3" (lời nhắn TIX3 Live Tour 2026), tự tạo nếu chưa có.
 *  Tên sổ lạ bị từ chối, nên không ai tạo thêm trang tính được.
 */
const BOOKS = { loichuc: 'LoiChuc', tix3: 'TIX3' };
const DEFAULT_BOOK = 'loichuc';
const MAX_NAME = 40;
const MAX_MSG = 300;
const MAX_ITEMS = 300;
// Từ cấm: so khớp nguyên từ, không phân biệt hoa thường. Thêm/bớt tuỳ ý.
const BAD_WORDS = ['địt', 'đụ', 'lồn', 'buồi', 'cặc', 'đéo', 'đĩ', 'đm', 'dm', 'dcm', 'đcm', 'vcl', 'vkl', 'vl', 'cc', 'clm', 'cl', 'cmm', 'dmm', 'đmm', 'fuck', 'shit', 'bitch'];

// Trả về khoá sổ hợp lệ, hoặc null nếu tên sổ không có trong BOOKS
function book_(raw) {
  const key = String(raw || DEFAULT_BOOK).toLowerCase();
  return Object.prototype.hasOwnProperty.call(BOOKS, key) ? key : null;
}

function sheet_(book) {
  const ss = SpreadsheetApp.getActive();
  const name = BOOKS[book];
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(['Thời gian', 'Tên', 'Lời chúc', 'Ẩn (gõ x để ẩn)']);
    sh.setFrozenRows(1);
    sh.setColumnWidth(3, 480);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(s, max) {
  return String(s || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function isBad_(text) {
  const words = String(text).toLowerCase().normalize('NFC').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return words.some(w => BAD_WORDS.includes(w));
}

// Chặn chèn công thức vào Sheets (= + - @ ở đầu ô)
const safeCell_ = s => (/^[=+\-@]/.test(s) ? "'" + s : s);

function doGet(e) {
  const book = book_(e && e.parameter && e.parameter.book);
  if (!book) return json_({ ok: false, error: 'book' });
  const rows = sheet_(book).getDataRange().getValues().slice(1);
  const items = rows
    .filter(r => r[1] && r[2] && !String(r[3]).trim())
    .map(r => ({ name: String(r[1]).replace(/^'/, ''), msg: String(r[2]).replace(/^'/, ''), t: new Date(r[0]).getTime() }))
    .slice(-MAX_ITEMS);
  return json_({ ok: true, book, items });
}

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.hp) return json_({ ok: true }); // bẫy bot: ô ẩn có chữ → bỏ qua
    const book = book_(d.book);
    if (!book) return json_({ ok: false, error: 'book' });
    const name = clean_(d.name, MAX_NAME);
    const msg = clean_(d.msg, MAX_MSG);
    if (!name || !msg) return json_({ ok: false, error: 'empty' });
    if (isBad_(name + ' ' + msg)) return json_({ ok: false, error: 'bad' });

    const cache = CacheService.getScriptCache();
    const key = 'n_' + book + '_' + Utilities.base64EncodeWebSafe(name.toLowerCase()).slice(0, 200);
    if (cache.get(key)) return json_({ ok: false, error: 'slow' }); // cùng tên gửi liên tục

    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      sheet_(book).appendRow([new Date(), safeCell_(name), safeCell_(msg), '']);
    } finally {
      lock.releaseLock();
    }
    cache.put(key, '1', 30);
    return json_({ ok: true, book, item: { name, msg, t: Date.now() } });
  } catch (err) {
    return json_({ ok: false, error: 'server' });
  }
}
