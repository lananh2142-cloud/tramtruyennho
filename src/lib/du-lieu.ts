import { getCollection, type CollectionEntry } from 'astro:content';

export type Truyen = CollectionEntry<'truyen'>;
export type Chuong = CollectionEntry<'chuong'>;

// Ghép đường dẫn với thư mục gốc của web (cần khi web nằm trong thư mục con trên GitHub Pages)
export function link(duongDan: string): string {
  const goc = import.meta.env.BASE_URL.replace(/\/$/, '');
  return goc + duongDan;
}

export const linkTruyen = (slug: string) => link(`/truyen/${slug}/`);
export const linkChuong = (slug: string, so: number) => link(`/truyen/${slug}/chuong-${so}/`);

export function slugCuaChuong(c: Chuong): string {
  return c.data.truyen;
}

export async function tatCaTruyen(): Promise<Truyen[]> {
  const ds = await getCollection('truyen');
  return ds.sort((a, b) => b.data.ngayDang.valueOf() - a.data.ngayDang.valueOf());
}

export async function chuongCuaTruyen(slug: string): Promise<Chuong[]> {
  const ds = await getCollection('chuong', (c) => slugCuaChuong(c) === slug);
  return ds.sort((a, b) => a.data.so - b.data.so);
}

export async function chuongMoiNhat(soLuong: number): Promise<Chuong[]> {
  const ds = await getCollection('chuong');
  return ds.sort((a, b) => b.data.ngayDang.valueOf() - a.data.ngayDang.valueOf()).slice(0, soLuong);
}

export function ngay(d: Date): string {
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Ảnh tải lên nằm trong thư mục public/, cần thêm thư mục gốc vào đường dẫn
export function anh(duongDan?: string): string | undefined {
  if (!duongDan) return undefined;
  return duongDan.startsWith('/') ? link(duongDan) : duongDan;
}

// Chuyển chữ có dấu thành dạng không dấu dùng trong đường dẫn: "Ngôn tình" -> "ngon-tinh"
export function khongDau(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const linkTheLoai = (ten: string) => link(`/the-loai/${khongDau(ten)}/`);

// Danh sách thể loại đang có truyện, kèm số truyện, xếp theo nhiều truyện nhất
export async function tatCaTheLoai(): Promise<{ ten: string; soTruyen: number }[]> {
  const dem = new Map<string, number>();
  for (const t of await tatCaTruyen()) for (const tl of t.data.theLoai) dem.set(tl, (dem.get(tl) ?? 0) + 1);
  return [...dem].map(([ten, soTruyen]) => ({ ten, soTruyen })).sort((a, b) => b.soTruyen - a.soTruyen || a.ten.localeCompare(b.ten, 'vi'));
}

// Thông tin tóm tắt của một truyện, dùng chung cho nhiều trang
export interface TomTat {
  truyen: Truyen;
  dsChuong: Chuong[];
  chuongMoi?: Chuong;
  capNhat: Date;
}

export async function tomTatTatCa(): Promise<TomTat[]> {
  const ds = await tatCaTruyen();
  return Promise.all(ds.map(async (truyen) => {
    const dsChuong = await chuongCuaTruyen(truyen.id);
    const chuongMoi = dsChuong[dsChuong.length - 1];
    const capNhat = dsChuong.reduce((m, c) => (c.data.ngayDang > m ? c.data.ngayDang : m), truyen.data.ngayDang);
    return { truyen, dsChuong, chuongMoi, capNhat };
  }));
}

// Truyện có chương mới trong 7 ngày gần nhất
export const laMoi = (d: Date) => Date.now() - d.valueOf() < 7 * 24 * 60 * 60 * 1000;

// ===== Ảnh hiển thị của truyện =====

// Lấy các đường dẫn hình có trong nội dung (dạng Markdown ![...](...) hoặc HTML <img src="...">)
export function anhTrongNoiDung(noiDung?: string): string[] {
  if (!noiDung) return [];
  const ds: { viTri: number; src: string }[] = [];
  for (const m of noiDung.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) ds.push({ viTri: m.index!, src: m[1] });
  for (const m of noiDung.matchAll(/<img\b[^>]*?\ssrc=["']([^"']+)["']/gi)) ds.push({ viTri: m.index!, src: m[1] });
  return ds.sort((a, b) => a.viTri - b.viTri).map((x) => x.src);
}

const VI_TRI_ANH = { 'Giữa': 'center', 'Trên': 'top', 'Dưới': 'bottom' } as const;
const boNhoAnh = new Map<string, Promise<{ src?: string; viTri: string }>>();

// Ảnh tác giả chọn; nếu chưa chọn thì lấy hình đầu tiên trong phần giới thiệu, rồi lần lượt trong các chương
export function anhHienThi(truyen: Truyen): Promise<{ src?: string; viTri: string }> {
  if (!boNhoAnh.has(truyen.id)) {
    boNhoAnh.set(truyen.id, (async () => {
      const viTri = VI_TRI_ANH[truyen.data.viTriAnh];
      if (truyen.data.anhBia) return { src: anh(truyen.data.anhBia), viTri };
      const dau = anhTrongNoiDung(truyen.body)[0]
        ?? (await chuongCuaTruyen(truyen.id)).map((c) => anhTrongNoiDung(c.body)[0]).find(Boolean);
      return { src: anh(dau), viTri };
    })());
  }
  return boNhoAnh.get(truyen.id)!;
}
