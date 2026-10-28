// Kết nối Firebase (đăng nhập, lưu tủ truyện, bình luận).
// Mã kết nối nằm trong src/data/firebase.json; mã này được phép công khai, bảo mật nằm ở luật truy cập (firestore.rules).
// Khi chưa điền mã kết nối, toàn bộ chức năng tài khoản tự ẩn và web chạy như trước.
import cauHinh from '../data/firebase.json';
import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

export const daBat = Boolean(cauHinh.apiKey);
export const coFacebook = cauHinh.facebook;
// Tài khoản của tác giả: được xoá mọi bình luận và có huy hiệu "Tác giả"
export const laQuanTri = (uid?: string | null) => !!uid && (cauHinh.quanTri as string[]).includes(uid);

// Chạy thử trên máy với Firebase giả lập (chỉ khi dựng web với PUBLIC_GIA_LAP=1)
const GIA_LAP = import.meta.env.PUBLIC_GIA_LAP === '1';

let app: Promise<FirebaseApp> | undefined;
let auth: Promise<Auth> | undefined;
let db: Promise<Firestore> | undefined;

function layApp() {
  app ??= import('firebase/app').then(({ initializeApp }) => {
    const { facebook, quanTri, ...ketNoi } = cauHinh;
    return initializeApp(ketNoi);
  });
  return app;
}

export function layAuth() {
  auth ??= Promise.all([layApp(), import('firebase/auth')]).then(([a, m]) => {
    const au = m.getAuth(a);
    au.languageCode = 'vi'; // email đặt lại mật khẩu, xác minh email bằng tiếng Việt
    if (GIA_LAP) { m.connectAuthEmulator(au, 'http://127.0.0.1:9099', { disableWarnings: true }); Object.assign(window, { __tramAuth: au, __tramAuthM: m }); }
    return au;
  });
  return auth;
}

export function layDb() {
  db ??= Promise.all([layApp(), import('firebase/firestore')]).then(([a, m]) => {
    const d = m.getFirestore(a);
    if (GIA_LAP) m.connectFirestoreEmulator(d, '127.0.0.1', 8080);
    return d;
  });
  return db;
}

// Theo dõi trạng thái đăng nhập; gọi lại ngay với người dùng hiện tại
type NgheTheo = (u: User | null) => void;
const dsNghe: NgheTheo[] = [];
let daBiet = false;
let hienTai: User | null = null;

export function theoDoiDangNhap(nghe: NgheTheo) {
  if (!daBat) return;
  dsNghe.push(nghe);
  if (daBiet) nghe(hienTai);
}

export function nguoiDungHienTai() {
  return hienTai;
}

export function baoCapNhatNguoiDung() {
  dsNghe.forEach((f) => f(hienTai));
}

if (daBat && typeof window !== 'undefined') {
  layAuth().then(async (au) => {
    const { onAuthStateChanged } = await import('firebase/auth');
    onAuthStateChanged(au, async (u) => {
      // Người đăng ký bằng email vừa bấm link xác minh: token cũ vẫn ghi "chưa xác minh" nên kho dữ liệu sẽ từ chối bình luận.
      // Hỏi lại máy chủ, và nếu đã xác minh thì xin token mới.
      if (u && u.providerData.some((p) => p.providerId === 'password')) {
        try {
          if (!(await u.getIdTokenResult()).claims.email_verified) {
            await u.reload();
            if (au.currentUser?.emailVerified) await au.currentUser.getIdToken(true);
          }
        } catch { /* mất mạng: dùng trạng thái cũ */ }
      }
      hienTai = au.currentUser ?? u;
      daBiet = true;
      dsNghe.forEach((f) => f(hienTai));
    });
  });
}

// Người dùng đăng ký bằng email phải xác minh email mới được bình luận (chống tài khoản rác)
export function daXacMinh(u: User) {
  return u.emailVerified || u.providerData.some((p) => p.providerId === 'google.com' || p.providerId === 'facebook.com');
}

export function tenHienThi(u: User) {
  return u.displayName || u.email?.split('@')[0] || 'Bạn đọc';
}

// Thông báo lỗi tiếng Việt cho các mã lỗi thường gặp của Firebase
export function loiTiengViet(e: unknown): string {
  const ma = (e as { code?: string })?.code ?? '';
  const BANG: Record<string, string> = {
    'auth/invalid-email': 'Email không hợp lệ.',
    'auth/missing-email': 'Bạn chưa nhập email.',
    'auth/missing-password': 'Bạn chưa nhập mật khẩu.',
    'auth/weak-password': 'Mật khẩu cần ít nhất 6 ký tự.',
    'auth/email-already-in-use': 'Email này đã có tài khoản. Bạn thử đăng nhập nhé.',
    'auth/invalid-credential': 'Email hoặc mật khẩu chưa đúng.',
    'auth/wrong-password': 'Email hoặc mật khẩu chưa đúng.',
    'auth/user-not-found': 'Không tìm thấy tài khoản với email này.',
    'auth/too-many-requests': 'Bạn thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.',
    'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập.',
    'auth/cancelled-popup-request': 'Bạn đã đóng cửa sổ đăng nhập.',
    'auth/account-exists-with-different-credential': 'Email này đã được dùng với cách đăng nhập khác. Bạn thử đăng nhập bằng Google hoặc email nhé.',
    'auth/network-request-failed': 'Mất kết nối mạng. Bạn kiểm tra mạng rồi thử lại.',
    'auth/requires-recent-login': 'Vì an toàn, bạn cần đăng nhập lại rồi thực hiện thao tác này.',
    'auth/unauthorized-domain': 'Trang web này chưa được phép đăng nhập. Vui lòng báo cho tác giả.',
    'permission-denied': 'Bạn không có quyền thực hiện thao tác này.',
  };
  return BANG[ma] ?? 'Có lỗi xảy ra, bạn thử lại sau nhé.';
}
