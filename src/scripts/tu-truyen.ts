// Lưu lịch sử đọc và tủ truyện trên trình duyệt của người đọc.
// Khi người đọc đăng nhập, dữ liệu này được đồng bộ với tài khoản (xem dong-bo.ts).
// Mỗi mục đều có thời điểm thay đổi (luc) để khi gộp dữ liệu giữa các máy, thay đổi mới hơn sẽ thắng;
// mục bị xoá được giữ lại với dấu "xoa" để không bị máy khác thêm trở lại.

export interface DaDoc { so: number; ten: string; luc: number; xoa?: boolean }
export interface MucLuu { luu: boolean; luc: number }
export interface DuLieuTu { lichSu: Record<string, DaDoc>; daLuu: Record<string, MucLuu> }

const KHOA_LICH_SU = 'tt-lich-su';
const KHOA_TU = 'tt-tu-truyen';
const KHOA_TU_CU = 'tt-da-luu'; // dạng cũ: mảng mã truyện
export const SU_KIEN_THAY_DOI = 'tt-thay-doi';

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

function baoThayDoi() {
  dispatchEvent(new Event(SU_KIEN_THAY_DOI));
}

// ===== Dữ liệu đầy đủ (kể cả mục đã xoá), dùng để đồng bộ =====

export function layDuLieu(): DuLieuTu {
  const lichSu = doc<Record<string, DaDoc>>(KHOA_LICH_SU, {});
  let daLuu = doc<Record<string, MucLuu> | null>(KHOA_TU, null);
  if (!daLuu) {
    // Chuyển từ dạng cũ (mảng) sang dạng mới
    const cu = doc<string[]>(KHOA_TU_CU, []);
    const bayGio = Date.now();
    daLuu = Object.fromEntries(cu.map((slug, i) => [slug, { luu: true, luc: bayGio - i }]));
  }
  return { lichSu, daLuu };
}

function luuDuLieu(d: DuLieuTu) {
  ghi(KHOA_LICH_SU, d.lichSu);
  ghi(KHOA_TU, d.daLuu);
}

// Gộp hai bộ dữ liệu: với mỗi truyện, giữ thay đổi mới hơn
export function gopDuLieu(a: DuLieuTu, b: DuLieuTu): DuLieuTu {
  const gop = <T extends { luc: number }>(x: Record<string, T>, y: Record<string, T>) => {
    const kq: Record<string, T> = { ...x };
    for (const [k, v] of Object.entries(y)) if (!kq[k] || v.luc > kq[k].luc) kq[k] = v;
    return kq;
  };
  return { lichSu: gop(a.lichSu, b.lichSu), daLuu: gop(a.daLuu, b.daLuu) };
}

// Ghi đè dữ liệu trên máy bằng dữ liệu đã gộp (không báo thay đổi để tránh đồng bộ vòng lặp)
export function ganDuLieu(d: DuLieuTu) {
  luuDuLieu(d);
  dispatchEvent(new Event('tt-da-dong-bo'));
}

// ===== Dùng cho giao diện =====

export const lichSu = (): Record<string, DaDoc> =>
  Object.fromEntries(Object.entries(layDuLieu().lichSu).filter(([, v]) => !v.xoa));

export function ghiLichSu(slug: string, so: number, ten: string) {
  const d = layDuLieu();
  d.lichSu[slug] = { so, ten, luc: Date.now() };
  luuDuLieu(d);
  baoThayDoi();
}

export function xoaLichSu(slug: string) {
  const d = layDuLieu();
  if (!d.lichSu[slug]) return;
  d.lichSu[slug] = { ...d.lichSu[slug], xoa: true, luc: Date.now() };
  luuDuLieu(d);
  baoThayDoi();
}

// Danh sách mã truyện đã lưu, mới lưu nằm trước
export const daLuu = (): string[] =>
  Object.entries(layDuLieu().daLuu).filter(([, v]) => v.luu).sort((a, b) => b[1].luc - a[1].luc).map(([k]) => k);

export function doiLuu(slug: string): boolean {
  const d = layDuLieu();
  const moi = !d.daLuu[slug]?.luu;
  d.daLuu[slug] = { luu: moi, luc: Date.now() };
  luuDuLieu(d);
  baoThayDoi();
  return moi;
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
