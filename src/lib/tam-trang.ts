// Chọn truyện theo tâm trạng: mỗi tâm trạng ứng với vài thể loại
export interface TamTrang { ma: string; ten: string; moTa: string; mau: string; theLoai: string[]; ngan?: boolean }

export const DS_TAM_TRANG: TamTrang[] = [
  { ma: 'cuoi', ten: 'Cười', moTa: 'Nhẹ nhàng, vui vẻ', mau: '#e9a23b', theLoai: ['Hài hước', 'Xuyên không', 'Học đường'] },
  { ma: 'khoc', ten: 'Khóc một chút', moTa: 'Cảm động, sâu lắng', mau: '#e0728c', theLoai: ['Ngôn tình', 'Hiện đại', 'Đô thị'] },
  { ma: 'hoi-hop', ten: 'Hồi hộp', moTa: 'Bí ẩn, rợn người', mau: '#7d6bd1', theLoai: ['Kinh dị', 'Linh dị', 'Tâm linh', 'Trinh thám'] },
  { ma: 'mo-mong', ten: 'Mơ mộng', moTa: 'Lãng mạn, thơ mộng', mau: '#d77fb4', theLoai: ['Ngôn tình', 'Cổ đại', 'Học đường'] },
  { ma: 'phieu-luu', ten: 'Phiêu lưu', moTa: 'Kỳ ảo, giang hồ, vũ trụ', mau: '#3f9e8f', theLoai: ['Tiên hiệp', 'Kiếm hiệp', 'Huyền huyễn', 'Phiêu lưu', 'Khoa học viễn tưởng'] },
  { ma: 'ngan', ten: 'Đọc nhanh trước khi ngủ', moTa: 'Truyện ngắn, ít chương', mau: '#5b7fc7', theLoai: ['Truyện ngắn'], ngan: true },
];

// Truyện có từ 10 chương trở xuống được xem là "đọc nhanh"
export const SO_CHUONG_NGAN = 10;

// Web tự đoán tâm trạng dựa theo thể loại và độ dài truyện
export function hopTamTrang(tt: TamTrang, theLoai: string[], soChuong: number): boolean {
  return theLoai.some((tl) => tt.theLoai.includes(tl)) || (!!tt.ngan && soChuong > 0 && soChuong <= SO_CHUONG_NGAN);
}

// Mã các tâm trạng của một truyện: dùng lựa chọn của tác giả nếu có, nếu không thì tự đoán
export function tamTrangCuaTruyen(daChon: string[], theLoai: string[], soChuong: number): string[] {
  // Chấp nhận cả tên cũ có chữ "Muốn" ở đầu (ví dụ "Muốn cười")
  const chuan = (x: string) => x.trim().toLowerCase().replace(/^muốn\s+/, '');
  const chon = daChon
    .map((x) => DS_TAM_TRANG.find((t) => chuan(t.ten) === chuan(x) || t.ma === x.trim()))
    .filter((t): t is TamTrang => !!t);
  const ds = chon.length > 0 ? chon : DS_TAM_TRANG.filter((t) => hopTamTrang(t, theLoai, soChuong));
  return ds.map((t) => t.ma);
}
