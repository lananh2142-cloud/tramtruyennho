// Lưu lịch sử đọc và tủ truyện ngay trên trình duyệt của người đọc (không cần đăng nhập)

export interface DaDoc { so: number; ten: string; luc: number }

const KHOA_LICH_SU = 'tt-lich-su';
const KHOA_DA_LUU = 'tt-da-luu';

function doc<T>(khoa: string, macDinh: T): T {
  try {
    const v = localStorage.getItem(khoa);
    return v ? (JSON.parse(v) as T) : macDinh;
  } catch {
    return macDinh;
  }
}

function ghi(khoa: string, giaTri: unknown) {
  try {
    localStorage.setItem(khoa, JSON.stringify(giaTri));
  } catch {
    /* trình duyệt chặn lưu trữ: bỏ qua */
  }
}

export const lichSu = () => doc<Record<string, DaDoc>>(KHOA_LICH_SU, {});

export function ghiLichSu(slug: string, so: number, ten: string) {
  const ls = lichSu();
  ls[slug] = { so, ten, luc: Date.now() };
  ghi(KHOA_LICH_SU, ls);
}

export function xoaLichSu(slug: string) {
  const ls = lichSu();
  delete ls[slug];
  ghi(KHOA_LICH_SU, ls);
}

export const daLuu = () => doc<string[]>(KHOA_DA_LUU, []);

export function doiLuu(slug: string): boolean {
  const ds = daLuu();
  const i = ds.indexOf(slug);
  if (i === -1) ds.unshift(slug);
  else ds.splice(i, 1);
  ghi(KHOA_DA_LUU, ds);
  return i === -1;
}

// "5 phút trước", "3 giờ trước", "2 ngày trước"...
export function thoiGianTruoc(ms: number): string {
  const giay = Math.max(0, (Date.now() - ms) / 1000);
  if (giay < 60) return 'Vừa xong';
  const phut = giay / 60;
  if (phut < 60) return `${Math.floor(phut)} phút trước`;
  const gio = phut / 60;
  if (gio < 24) return `${Math.floor(gio)} giờ trước`;
  const ngay = gio / 24;
  if (ngay < 30) return `${Math.floor(ngay)} ngày trước`;
  return new Date(ms).toLocaleDateString('vi-VN');
}

// Đổi mọi <time data-tuong-doi> thành dạng "x giờ trước"
export function capNhatThoiGian() {
  document.querySelectorAll<HTMLTimeElement>('time[data-tuong-doi]').forEach((t) => {
    t.textContent = thoiGianTruoc(new Date(t.dateTime).valueOf());
  });
}
