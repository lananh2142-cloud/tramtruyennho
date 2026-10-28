import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import caiDat from '../data/cai-dat.json';
import { tatCaTruyen, chuongMoiNhat, slugCuaChuong, linkChuong } from '../lib/du-lieu';

export async function GET(context: APIContext) {
  const ten = Object.fromEntries((await tatCaTruyen()).map((t) => [t.id, t.data.ten]));
  const ds = await chuongMoiNhat(50);
  return rss({
    title: caiDat.tenWeb,
    description: caiDat.moTa,
    site: context.site!,
    items: ds.map((c) => ({
      title: `${ten[slugCuaChuong(c)] ?? ''} - Chương ${c.data.so}: ${c.data.ten}`,
      pubDate: c.data.ngayDang,
      link: linkChuong(slugCuaChuong(c), c.data.so),
    })),
  });
}
