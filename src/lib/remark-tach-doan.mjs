// Người viết thường dán truyện với mỗi đoạn văn trên một dòng (chỉ xuống dòng một lần).
// Markdown mặc định sẽ nối các dòng đó thành một đoạn dài, nên ở đây ta tách mỗi dòng thành một đoạn riêng.
// Dòng chỉ có ký hiệu ngắt cảnh (⸻, ***, * * *, ~~~, ✦ ✦ ✦...) được đổi thành dấu ngắt cảnh;
// dòng viết hoa ngắn ngay sau dấu ngắt cảnh (ví dụ "🕯️ NHỮNG ĐÊM ĐẦU TIÊN") được đổi thành tiêu đề mục.
const NGAT_CANH = /^\s*(⸻+|—{2,}|-{3,}|_{3,}|\*{3,}|(\*\s){2,}\*|~{3,}|(✦\s*){3}|(•\s*){3}|(o\s*){3}|#{3,})\s*$/;

function tachDoan(doan) {
  const nhom = [[]];
  for (const con of doan.children) {
    if (con.type === 'break') { nhom.push([]); continue; }
    if (con.type === 'text' && con.value.includes('\n')) {
      con.value.split('\n').forEach((phan, i) => {
        if (i > 0) nhom.push([]);
        if (phan) nhom[nhom.length - 1].push({ type: 'text', value: phan });
      });
      continue;
    }
    nhom[nhom.length - 1].push(con);
  }
  return nhom
    .filter((n) => n.some((c) => c.type !== 'text' || c.value.trim()))
    .map((n) => (n.length === 1 && n[0].type === 'text' && NGAT_CANH.test(n[0].value)
      ? { type: 'thematicBreak' }
      : { type: 'paragraph', children: n }));
}

// Dòng ngắn, có chữ cái và toàn bộ chữ cái đều viết hoa
function laTieuDe(nut) {
  if (nut.type !== 'paragraph' || nut.children.length !== 1 || nut.children[0].type !== 'text') return false;
  const chu = nut.children[0].value.trim();
  return chu.length <= 80 && /\p{L}/u.test(chu) && chu === chu.toLocaleUpperCase('vi');
}

function duyet(nut) {
  if (!nut.children) return;
  const moi = [];
  for (const con of nut.children) {
    if (con.type === 'paragraph') moi.push(...tachDoan(con));
    else { duyet(con); moi.push(con); }
  }
  nut.children = moi.map((con, i) =>
    i > 0 && moi[i - 1].type === 'thematicBreak' && laTieuDe(con) ? { type: 'heading', depth: 3, children: con.children } : con);
}

export default function remarkTachDoan() {
  return (cay) => duyet(cay);
}
