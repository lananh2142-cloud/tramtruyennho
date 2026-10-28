import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Trang quản trị có thể ghi ô để trống thành "null"; các kiểu dưới đây coi "null" như để trống
const chuoiTuyChon = z.string().nullish().transform((v) => v || undefined);
const danhSach = z.array(z.string()).nullish().transform((v) => v ?? []);

// Mỗi truyện là một tệp trong src/content/truyen/
const truyen = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/truyen' }),
  schema: z.object({
    ten: z.string(),
    ma: chuoiTuyChon,
    tacGia: chuoiTuyChon,
    gioiThieu: z.string(),
    // Ảnh hiển thị của truyện. Để trống thì web tự lấy hình đầu tiên có trong truyện
    anhBia: chuoiTuyChon,
    // Phần nào của ảnh được giữ lại khi ảnh phải cắt cho vừa khung
    viTriAnh: z.enum(['Giữa', 'Trên', 'Dưới']).nullish().transform((v) => v ?? 'Giữa'),
    theLoai: danhSach,
    trangThai: z.enum(['Đang ra', 'Hoàn thành', 'Tạm dừng']).nullish().transform((v) => v ?? 'Đang ra'),
    // Bật lên để truyện hiện ở mục "Truyện đề cử" trên trang chủ
    deCu: z.boolean().nullish().transform((v) => v ?? false),
    // Tâm trạng do tác giả chọn; để trống thì web tự xếp theo thể loại và độ dài
    tamTrang: danhSach,
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
    loiTacGia: chuoiTuyChon,
    ngayDang: z.coerce.date(),
  }),
});

export const collections = { truyen, chuong };
