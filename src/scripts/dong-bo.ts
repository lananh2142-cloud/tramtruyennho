// Đồng bộ Tủ truyện và Đọc tiếp với tài khoản: khi đăng nhập thì gộp dữ liệu trên máy với dữ liệu trên tài khoản,
// sau đó mỗi lần người đọc đọc chương mới hay lưu/bỏ truyện thì tự gửi lên tài khoản.
import { theoDoiDangNhap, layDb } from './firebase';
import { layDuLieu, gopDuLieu, ganDuLieu, SU_KIEN_THAY_DOI, type DuLieuTu } from './tu-truyen';

let uid: string | null = null;
let hen: ReturnType<typeof setTimeout> | undefined;

async function guiLen() {
  if (!uid) return;
  const [db, { doc, setDoc, serverTimestamp }] = await Promise.all([layDb(), import('firebase/firestore')]);
  await setDoc(doc(db, 'nguoiDung', uid), { ...layDuLieu(), capNhat: serverTimestamp() });
}

theoDoiDangNhap(async (u) => {
  uid = u?.uid ?? null;
  if (!uid) return;
  try {
    const [db, { doc, getDoc }] = await Promise.all([layDb(), import('firebase/firestore')]);
    const anh = await getDoc(doc(db, 'nguoiDung', uid));
    const tren = anh.exists() ? (anh.data() as Partial<DuLieuTu>) : {};
    const gop = gopDuLieu(layDuLieu(), { lichSu: tren.lichSu ?? {}, daLuu: tren.daLuu ?? {} });
    ganDuLieu(gop);
    await guiLen();
  } catch (e) {
    console.warn('Chưa đồng bộ được tủ truyện:', e);
  }
});

addEventListener(SU_KIEN_THAY_DOI, () => {
  if (!uid) return;
  clearTimeout(hen);
  hen = setTimeout(() => guiLen().catch((e) => console.warn('Chưa đồng bộ được tủ truyện:', e)), 1500);
});
