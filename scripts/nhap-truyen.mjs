// Đăng truyện bằng file Word (.docx) hoặc PDF.
// Tác giả tạo một "yêu cầu" trong trang quản trị (mục "Đăng nhanh bằng file Word/PDF"), tải file lên;
// GitHub tự chạy chương trình này: đọc file, tự tách chương theo các dòng "Chương 1", "Phần 2"...,
// tạo các tệp chương trong src/content/chuong/, rồi ghi kết quả vào ô "Kết quả" của yêu cầu.
//
// Chạy thử trên máy: node scripts/nhap-truyen.mjs
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import mammoth from 'mammoth';

const GOC = process.cwd();
const THU_MUC_YEU_CAU = path.join(GOC, 'nhap-truyen');
const THU_MUC_FILE = path.join(GOC, 'nhap-truyen-file');
const THU_MUC_TRUYEN = path.join(GOC, 'src/content/truyen');
const THU_MUC_CHUONG = path.join(GOC, 'src/content/chuong');
const THU_MUC_HINH = path.join(GOC, 'public/images');

// Dòng mở đầu một chương: "Chương 1", "CHƯƠNG 12: Tên", "Phần II – Tên", "Hồi 3", "Chapter 4"...
const SO_CHU = 'một|hai|ba|bốn|tư|năm|sáu|bảy|tám|chín|mười|mươi|lăm|mốt';
const DAU_CHUONG = new RegExp(
  `^\\s*(chương|chuong|phần|phan|hồi|hoi|quyển|quyen|chapter|part)\\s+((\\d+)|([ivxlcdm]+)|((?:${SO_CHU})(?:\\s+(?:${SO_CHU}))*))(?=$|[\\s:.\\-–—)])\\s*[:.\\-–—)]?\\s*(.*)$`,
  'iu',
);

// ===== Đọc file thành danh sách khối: { loai: 'doan' | 'tieuDe' | 'hinh', chu } =====

// Chữ thường trong truyện có thể chứa ký tự mà Markdown hiểu nhầm (*, _, # đầu dòng, "1." đầu dòng...)
function thoatMarkdown(chu) {
  return chu.replace(/([\\`*_[\]<>|])/g, '\\$1');
}
function thoatDauDong(chu) {
  return chu
    .replace(/^(\s*)([#>+=-])(?=\s|$)/, '$1\\$2')
    .replace(/^(\s*\d+)([.)])(?=\s|$)/, '$1\\$2');
}

const giaiMaHtml = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&');

// Đổi phần HTML bên trong một đoạn (mammoth sinh ra) thành chữ Markdown, giữ in đậm / in nghiêng
function htmlTrongDoan(html) {
  const phan = html.split(/(<\/?(?:strong|b|em|i)>|<br\s*\/?>)/i);
  let kq = '';
  for (const p of phan) {
    if (/^<\/?(strong|b)>$/i.test(p)) kq += '**';
    else if (/^<\/?(em|i)>$/i.test(p)) kq += '*';
    else if (/^<br/i.test(p)) kq += '\n';
    else kq += thoatMarkdown(giaiMaHtml(p.replace(/<[^>]+>/g, '')));
  }
  // Bỏ cặp đánh dấu rỗng và khoảng trắng nằm trong dấu đánh dấu (Markdown không nhận "** chữ**")
  return kq.replace(/\*\*\*\*|(?<!\*)\*\*(?!\*)(?=\*\*)/g, '').replace(/(\*{1,2})(\s+)([^*]+?)(\s*)\1/g, (m, d, a, b, c) => `${a}${d}${b}${d}${c}`);
}

async function docWord(duongDan, maTruyen, luuHinh) {
  let soHinh = 0;
  const { value: html } = await mammoth.convertToHtml({ path: duongDan }, {
    convertImage: mammoth.images.imgElement(async (hinh) => {
      const duoi = (hinh.contentType.split('/')[1] || 'png').replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '');
      const ten = `${maTruyen}-${Date.now().toString(36)}-${++soHinh}.${duoi}`;
      luuHinh(ten, await hinh.read());
      return { src: `/images/${ten}` };
    }),
  });
  const khoi = [];
  for (const m of html.matchAll(/<(p|h[1-6]|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const [, the, trong] = m;
    for (const anh of trong.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi)) khoi.push({ loai: 'hinh', chu: anh[1] });
    const chu = htmlTrongDoan(trong.replace(/<img\b[^>]*>/gi, ''));
    for (const dong of chu.split('\n')) {
      if (!dong.trim()) continue;
      khoi.push({ loai: /^h/i.test(the) ? 'tieuDe' : 'doan', chu: dong.trim(), tho: giaiMaHtml(dong.replace(/\\(.)/g, '$1').replace(/\*/g, '')).trim() });
    }
  }
  return khoi;
}

async function docPdf(duongDan) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const tai = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(duongDan)), useSystemFonts: true, isEvalSupported: false }).promise;
  // Gom chữ thành từng dòng theo toạ độ dọc
  const dong = [];
  for (let i = 1; i <= tai.numPages; i++) {
    const trang = await tai.getPage(i);
    const nd = await trang.getTextContent();
    const theoY = new Map();
    for (const it of nd.items) {
      if (!('str' in it)) continue;
      const y = Math.round(it.transform[5]);
      const k = [...theoY.keys()].find((yy) => Math.abs(yy - y) <= 2) ?? y;
      if (!theoY.has(k)) theoY.set(k, []);
      theoY.get(k).push({ x: it.transform[4], chu: it.str, rong: it.width, cao: it.height || Math.abs(it.transform[3]) });
    }
    const ys = [...theoY.keys()].sort((a, b) => b - a);
    for (const y of ys) {
      const muc = theoY.get(y).sort((a, b) => a.x - b.x);
      let chu = '';
      let cuoi = null;
      for (const m of muc) {
        if (cuoi !== null && m.x - cuoi > 1.5 && !chu.endsWith(' ') && !m.chu.startsWith(' ')) chu += ' ';
        chu += m.chu;
        cuoi = m.x + m.rong;
      }
      chu = chu.replace(/\s+/g, ' ').trim();
      if (!chu) continue;
      dong.push({ trang: i, y, x: muc[0].x, phai: cuoi, cao: Math.max(...muc.map((m) => m.cao)), chu });
    }
  }
  // Bỏ số trang (dòng chỉ có số)
  const sach = dong.filter((d) => !/^(trang\s*)?\d{1,4}$/i.test(d.chu));
  if (!sach.length) return [];
  // Khoảng cách dòng phổ biến, lề trái và lề phải phổ biến, để nhận ra chỗ bắt đầu đoạn mới
  const trungVi = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
  const khoangCach = [];
  for (let i = 1; i < sach.length; i++) if (sach[i].trang === sach[i - 1].trang) khoangCach.push(sach[i - 1].y - sach[i].y);
  const dongThuong = trungVi(khoangCach.filter((k) => k > 0)) || 14;
  const leTrai = trungVi(sach.map((d) => d.x));
  const lePhai = Math.max(...sach.map((d) => d.phai));
  const coChu = trungVi(sach.map((d) => d.cao)) || 11;

  const khoi = [];
  let hienTai = null;
  sach.forEach((d, i) => {
    const truoc = sach[i - 1];
    const doanMoi = !truoc
      || d.trang !== truoc.trang && (/[.!?…”"»:]$/.test(truoc.chu) && truoc.phai < lePhai - coChu * 3)
      || d.trang === truoc.trang && truoc.y - d.y > dongThuong * 1.45
      || d.x > leTrai + coChu * 0.8 // thụt đầu dòng
      || /[.!?…”"»:]$/.test(truoc.chu) && truoc.phai < lePhai - coChu * 3 // dòng trước kết thúc sớm
      || laDauChuong(d.chu) || laDauChuong(truoc.chu)
      || /^[-–—•]\s/.test(d.chu);
    // Tên chương dài bị ngắt xuống dòng (chữ to giống dòng trên, sát ngay bên dưới): nối lại
    const noiTieuDe = hienTai && truoc && d.trang === truoc.trang && laDauChuong(hienTai.tho)
      && truoc.cao > coChu * 1.1 && Math.abs(d.cao - truoc.cao) < 0.5 && truoc.y - d.y < truoc.cao * 1.8;
    if (noiTieuDe) {
      hienTai.tho = `${hienTai.tho} ${d.chu}`;
    } else if (doanMoi) {
      hienTai = { loai: 'doan', tho: d.chu };
      khoi.push(hienTai);
    } else {
      // Nối dòng; chữ bị gạch nối cuối dòng thì nối liền
      hienTai.tho = /[-‐]$/.test(hienTai.tho) && /^\p{Ll}/u.test(d.chu) ? hienTai.tho.slice(0, -1) + d.chu : `${hienTai.tho} ${d.chu}`;
    }
  });
  return khoi.map((k) => ({ ...k, chu: thoatMarkdown(k.tho) }));
}

// ===== Tách chương =====

// Một dòng là đầu chương nếu khớp mẫu "Chương 1..." và trông giống tiêu đề: ngắn, và sau số chương
// là hết dòng hoặc có dấu ngăn cách (":", "-", "."), hoặc cả dòng viết hoa, hoặc là tiêu đề trong Word.
// Nhờ vậy câu văn như "Hồi hai giờ sáng, tôi tỉnh dậy." không bị nhầm là đầu chương.
function laDauChuong(tho, loai) {
  if (tho.length > 160) return null;
  const m = tho.match(DAU_CHUONG);
  if (!m) return null;
  const sauSo = tho.slice(tho.toLowerCase().indexOf(m[2].toLowerCase()) + m[2].length);
  const coNgan = /^\s*($|[:.\-–—)])/.test(sauSo);
  const vietHoa = tho === tho.toLocaleUpperCase('vi');
  return coNgan || vietHoa || loai === 'tieuDe' ? m : null;
}

const NGAT_CANH = /^\s*(⸻+|—{2,}|-{3,}|_{3,}|\*{3,}|(\*\s){2,}\*|~{3,}|(✦\s*){3}|#{3,})\s*$/;

function tachChuong(khoi) {
  const chuong = [];
  let hienTai = { tieuDe: null, khoi: [] };
  for (const k of khoi) {
    const tho = k.tho ?? k.chu;
    const m = k.loai !== 'hinh' && laDauChuong(tho, k.loai);
    if (m) {
      chuong.push(hienTai);
      hienTai = { tieuDe: tho, phanSau: m[6]?.trim(), khoi: [] };
    } else hienTai.khoi.push(k);
  }
  chuong.push(hienTai);
  // Phần trước chương đầu tiên (thường là tên truyện, tên tác giả): bỏ nếu ngắn, giữ làm "Mở đầu" nếu dài
  const mo = chuong[0];
  const doDai = mo.khoi.reduce((a, k) => a + (k.tho ?? k.chu).length, 0);
  if (chuong.length > 1 && (doDai < 400 && !mo.khoi.some((k) => k.loai === 'hinh'))) chuong.shift();
  else if (chuong.length > 1) mo.tieuDe = 'Mở đầu';
  return chuong.filter((c) => c.khoi.length > 0);
}

function noiDungMarkdown(khoi) {
  return khoi.map((k) => {
    if (k.loai === 'hinh') return `![](${k.chu})`;
    if (NGAT_CANH.test(k.tho ?? k.chu)) return '* * *';
    if (k.loai === 'tieuDe') return `### ${k.chu}`;
    return thoatDauDong(k.chu);
  }).join('\n\n') + '\n';
}

// ===== Xử lý từng yêu cầu =====

function ngayHomNay() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}
function gioHienTai() {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }).format(new Date());
}

function docYeuCau(tep) {
  const noiDung = fs.readFileSync(tep, 'utf8');
  const m = noiDung.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return { du: (m && YAML.parse(m[1])) || {}, than: m ? m[2] : noiDung };
}

function ghiYeuCau(tep, du, than) {
  fs.writeFileSync(tep, `---\n${YAML.stringify(du, { lineWidth: 0 })}---\n${than ?? ''}`);
}

function timTruyen(ma) {
  if (!fs.existsSync(THU_MUC_TRUYEN)) return null;
  for (const ten of fs.readdirSync(THU_MUC_TRUYEN)) {
    if (!ten.endsWith('.md')) continue;
    const id = ten.replace(/\.md$/, '');
    const { du } = docYeuCau(path.join(THU_MUC_TRUYEN, ten));
    if (id === ma || du.ma === ma) return { id, ten: du.ten };
  }
  return null;
}

async function xuLy(tep) {
  const { du, than } = docYeuCau(tep);
  if (du.ketQua && String(du.ketQua).trim()) return null; // đã xử lý rồi
  // Ô chọn truyện lưu đường dẫn tệp truyện (src/content/truyen/<mã>.md): lấy phần <mã>
  const maTruyen = String(du.truyen ?? '').trim().replace(/^.*\//, '').replace(/\.md$/, '');
  const fileTai = String(du.file ?? '').trim();
  const batDau = Math.max(1, Number(du.chuongBatDau) || 1);
  const ghiDe = du.ghiDe === true;

  const truyen = maTruyen && timTruyen(maTruyen);
  let ketQua;
  const hinhMoi = [];
  try {
    if (!maTruyen) throw new Error('Bạn chưa điền mã truyện.');
    if (!truyen) throw new Error(`Không tìm thấy truyện có mã "${maTruyen}". Bạn tạo truyện ở mục Truyện trước, rồi điền đúng mã truyện.`);
    if (!fileTai) throw new Error('Bạn chưa tải file Word hoặc PDF lên.');
    const duongDan = path.join(GOC, fileTai.replace(/^\/+/, ''));
    if (!fs.existsSync(duongDan)) throw new Error(`Không tìm thấy file đã tải lên (${path.basename(fileTai)}). Bạn thử tải lại nhé.`);
    const duoi = path.extname(duongDan).toLowerCase();

    let khoi;
    if (duoi === '.docx') khoi = await docWord(duongDan, truyen.id, (ten, du) => hinhMoi.push({ ten, du }));
    else if (duoi === '.pdf') khoi = await docPdf(duongDan);
    else if (duoi === '.doc') throw new Error('File .doc (Word đời cũ) chưa đọc được. Bạn mở file trong Word, chọn Lưu thành (Save As) định dạng .docx rồi tải lại nhé.');
    else throw new Error(`Chưa hỗ trợ file ${duoi}. Bạn dùng file .docx hoặc .pdf nhé.`);
    if (!khoi.some((k) => k.loai !== 'hinh')) throw new Error('Không đọc được chữ nào trong file. Nếu là PDF chụp ảnh/scan thì web chưa đọc được; bạn dùng file Word nhé.');

    const dsChuong = tachChuong(khoi);
    const tenFile = path.basename(fileTai).replace(/\.[^.]+$/, '');
    const taoMoi = [];
    const boQua = [];
    dsChuong.forEach((c, i) => {
      const so = batDau + i;
      const tepChuong = path.join(THU_MUC_CHUONG, `${truyen.id}-chuong-${so}.md`);
      if (fs.existsSync(tepChuong) && !ghiDe) { boQua.push(so); return; }
      const ten = (c.phanSau || c.tieuDe || (dsChuong.length === 1 && du.tenChuong) || (dsChuong.length === 1 ? tenFile : `Chương ${so}`)).slice(0, 200);
      const dau = { truyen: truyen.id, ten: String(du.tenChuong && dsChuong.length === 1 ? du.tenChuong : ten), so, ngayDang: ngayHomNay() };
      fs.mkdirSync(THU_MUC_CHUONG, { recursive: true });
      fs.writeFileSync(tepChuong, `---\n${YAML.stringify(dau, { lineWidth: 0 })}---\n\n${noiDungMarkdown(c.khoi)}`);
      taoMoi.push(so);
    });
    for (const h of hinhMoi) {
      fs.mkdirSync(THU_MUC_HINH, { recursive: true });
      fs.writeFileSync(path.join(THU_MUC_HINH, h.ten), h.du);
    }
    const khoang = (ds) => (ds.length > 1 ? `${ds[0]}–${ds[ds.length - 1]}` : `${ds[0]}`);
    ketQua = taoMoi.length
      ? `✅ ${gioHienTai()}: đã đăng ${taoMoi.length} chương (chương ${khoang(taoMoi)}) vào truyện "${truyen.ten}".`
      : '❌ Không đăng chương nào.';
    if (hinhMoi.length) ketQua += ` Kèm ${hinhMoi.length} hình.`;
    if (boQua.length) ketQua += ` Bỏ qua chương ${khoang(boQua)} vì đã có sẵn (bật ô "Ghi đè" nếu muốn thay).`;
    // File gốc không cần nữa: xoá để kho gọn nhẹ
    fs.rmSync(duongDan, { force: true });
    du.file = '';
  } catch (e) {
    ketQua = `❌ ${gioHienTai()}: ${e.message}`;
  }
  du.ketQua = ketQua;
  ghiYeuCau(tep, du, than);
  return ketQua;
}

if (!fs.existsSync(THU_MUC_YEU_CAU)) process.exit(0);
const dsYeuCau = fs.readdirSync(THU_MUC_YEU_CAU).filter((t) => t.endsWith('.md') && !/^readme\.md$/i.test(t)).map((t) => path.join(THU_MUC_YEU_CAU, t));
for (const tep of dsYeuCau) {
  const kq = await xuLy(tep);
  if (kq) console.log(`${path.basename(tep)}: ${kq}`);
}
