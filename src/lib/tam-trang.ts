// Chọn truyện theo tâm trạng: mỗi tâm trạng ứng với vài thể loại
export interface TamTrang { ma: string; ten: string; moTa: string; icon: string; mau: string; theLoai: string[]; ngan?: boolean }

export const DS_TAM_TRANG: TamTrang[] = [
  { ma: 'cuoi', ten: 'Muốn cười', moTa: 'Nhẹ nhàng, vui vẻ', icon: 'cuoi', mau: '#e9a23b', theLoai: ['Hài hước', 'Xuyên không', 'Học đường'] },
  { ma: 'khoc', ten: 'Muốn khóc một chút', moTa: 'Cảm động, sâu lắng', icon: 'tim', mau: '#e0728c', theLoai: ['Ngôn tình', 'Hiện đại', 'Đô thị'] },
  { ma: 'hoi-hop', ten: 'Muốn hồi hộp', moTa: 'Bí ẩn, rợn người', icon: 'mat', mau: '#7d6bd1', theLoai: ['Kinh dị', 'Linh dị', 'Tâm linh', 'Trinh thám'] },
  { ma: 'mo-mong', ten: 'Muốn mơ mộng', moTa: 'Lãng mạn, thơ mộng', icon: 'lap-lanh', mau: '#d77fb4', theLoai: ['Ngôn tình', 'Cổ đại', 'Học đường'] },
  { ma: 'phieu-luu', ten: 'Muốn phiêu lưu', moTa: 'Kỳ ảo, giang hồ, vũ trụ', icon: 'la-ban', mau: '#3f9e8f', theLoai: ['Tiên hiệp', 'Kiếm hiệp', 'Huyền huyễn', 'Phiêu lưu', 'Khoa học viễn tưởng'] },
  { ma: 'ngan', ten: 'Đọc nhanh trước khi ngủ', moTa: 'Truyện ngắn, ít chương', icon: 'trang', mau: '#5b7fc7', theLoai: ['Truyện ngắn'], ngan: true },
];

// Truyện có từ 10 chương trở xuống được xem là "đọc nhanh"
export const SO_CHUONG_NGAN = 10;

export function hopTamTrang(tt: TamTrang, theLoai: string[], soChuong: number): boolean {
  return theLoai.some((tl) => tt.theLoai.includes(tl)) || (!!tt.ngan && soChuong > 0 && soChuong <= SO_CHUONG_NGAN);
}
