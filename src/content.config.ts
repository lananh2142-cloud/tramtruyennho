import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Mỗi truyện là một tệp trong src/content/truyen/
const truyen = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/truyen' }),
  schema: z.object({
    ten: z.string(),
    ma: z.string().optional(),
    tacGia: z.string().optional(),
    gioiThieu: z.string(),
    // Ảnh hiển thị của truyện. Để trống thì web tự lấy hình đầu tiên có trong truyện
    anhBia: z.string().optional(),
    // Phần nào của ảnh được giữ lại khi ảnh phải cắt cho vừa khung
    viTriAnh: z.enum(['Giữa', 'Trên', 'Dưới']).default('Giữa'),
    theLoai: z.array(z.string()).default([]),
    trangThai: z.enum(['Đang ra', 'Hoàn thành', 'Tạm dừng']).default('Đang ra'),
    // Bật lên để truyện hiện ở mục "Truyện đề cử" trên trang chủ
    deCu: z.boolean().default(false),
    ngayDang: z.coerce.date(),
  }),
});

// Mỗi chương là một tệp trong src/content/chuong/, trường "truyen" là mã của truyện chứa chương
const chuong = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chuong' }),
  schema: z.object({
    truyen: z.string(),
    ten: z.string(),
    so: z.number(),
    // Lời nhắn của tác giả hiện ở cuối chương (không bắt buộc)
    loiTacGia: z.string().optional(),
    ngayDang: z.coerce.date(),
  }),
});

export const collections = { truyen, chuong };
