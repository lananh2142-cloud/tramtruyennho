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
