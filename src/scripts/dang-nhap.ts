// Nút đăng nhập ở đầu trang và hộp đăng nhập / đăng ký
import { layAuth, theoDoiDangNhap, loiTiengViet, tenHienThi, baoCapNhatNguoiDung } from './firebase';

const hop = document.getElementById('hop-dang-nhap') as HTMLDialogElement | null;
const thongBao = hop?.querySelector<HTMLElement>('.thong-bao-hop');

function bao(chu: string, loai: 'loi' | 'tot' = 'loi') {
  if (!thongBao) return;
  thongBao.textContent = chu;
  thongBao.dataset.loai = loai;
}

export function moHopDangNhap(the: 'dang-nhap' | 'dang-ky' = 'dang-nhap') {
  if (!hop) return;
  bao('');
  chonThe(the);
  hop.showModal();
}

function chonThe(the: string) {
  hop?.querySelectorAll<HTMLButtonElement>('[data-the]').forEach((b) => {
    const chon = b.dataset.the === the;
    b.classList.toggle('chon', chon);
    b.setAttribute('aria-selected', String(chon));
  });
  hop?.querySelectorAll<HTMLFormElement>('[data-form]').forEach((f) => (f.hidden = f.dataset.form !== the));
}

// Bất kỳ nút nào có data-mo-dang-nhap đều mở hộp đăng nhập
document.addEventListener('click', (e) => {
  const nut = (e.target as HTMLElement).closest<HTMLElement>('[data-mo-dang-nhap]');
  if (nut) { e.preventDefault(); moHopDangNhap(nut.dataset.moDangNhap === 'dang-ky' ? 'dang-ky' : 'dang-nhap'); }
});

if (hop) {
  hop.querySelector('[data-dong]')!.addEventListener('click', () => hop.close());
  hop.addEventListener('click', (e) => { if (e.target === hop) hop.close(); }); // bấm ra ngoài để đóng
  hop.querySelectorAll<HTMLButtonElement>('[data-the]').forEach((b) => b.addEventListener('click', () => { bao(''); chonThe(b.dataset.the!); }));

  const dangCho = (nut: HTMLButtonElement | null, cho: boolean) => { if (nut) nut.disabled = cho; };

  // Google / Facebook
  hop.querySelectorAll<HTMLButtonElement>('[data-dang-nhap]').forEach((nut) => nut.addEventListener('click', async () => {
    bao('');
    dangCho(nut, true);
    try {
      const [au, m] = await Promise.all([layAuth(), import('firebase/auth')]);
      const nhaCungCap = nut.dataset.dangNhap === 'facebook' ? new m.FacebookAuthProvider() : new m.GoogleAuthProvider();
      try {
        await m.signInWithPopup(au, nhaCungCap);
      } catch (e) {
        // Trình duyệt chặn cửa sổ bật lên: chuyển sang trang đăng nhập
        if ((e as { code?: string }).code === 'auth/popup-blocked') await m.signInWithRedirect(au, nhaCungCap);
        else throw e;
      }
      hop.close();
    } catch (e) {
      console.warn('Đăng nhập chưa được:', e);
      bao(loiTiengViet(e));
    } finally {
      dangCho(nut, false);
    }
  }));

  // Đăng nhập bằng email
  const formDangNhap = hop.querySelector<HTMLFormElement>('[data-form="dang-nhap"]')!;
  formDangNhap.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(formDangNhap);
    const nut = formDangNhap.querySelector<HTMLButtonElement>('[type="submit"]');
    dangCho(nut, true);
    try {
      const [au, m] = await Promise.all([layAuth(), import('firebase/auth')]);
      await m.signInWithEmailAndPassword(au, String(f.get('email')).trim(), String(f.get('matKhau')));
      formDangNhap.reset();
      hop.close();
    } catch (err) {
      bao(loiTiengViet(err));
    } finally {
      dangCho(nut, false);
    }
  });

  // Quên mật khẩu
  hop.querySelector('[data-quen]')!.addEventListener('click', async () => {
    const email = String(new FormData(formDangNhap).get('email') ?? '').trim();
    if (!email) { bao('Bạn nhập email vào ô Email trước, rồi bấm "Quên mật khẩu?" nhé.'); return; }
    try {
      const [au, m] = await Promise.all([layAuth(), import('firebase/auth')]);
      await m.sendPasswordResetEmail(au, email);
      bao(`Nếu ${email} có tài khoản, Trạm đã gửi email đặt lại mật khẩu. Bạn kiểm tra hộp thư (cả mục Thư rác) nhé.`, 'tot');
    } catch (err) {
      bao(loiTiengViet(err));
    }
  });

  // Tạo tài khoản bằng email
  const formDangKy = hop.querySelector<HTMLFormElement>('[data-form="dang-ky"]')!;
  formDangKy.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(formDangKy);
    const ten = String(f.get('ten')).trim();
    if (String(f.get('matKhau')) !== String(f.get('matKhau2'))) { bao('Hai lần nhập mật khẩu chưa giống nhau.'); return; }
    if (!ten) { bao('Bạn chưa nhập tên hiển thị.'); return; }
    const nut = formDangKy.querySelector<HTMLButtonElement>('[type="submit"]');
    dangCho(nut, true);
    try {
      const [au, m] = await Promise.all([layAuth(), import('firebase/auth')]);
      const kq = await m.createUserWithEmailAndPassword(au, String(f.get('email')).trim(), String(f.get('matKhau')));
      await m.updateProfile(kq.user, { displayName: ten });
      baoCapNhatNguoiDung();
      await m.sendEmailVerification(kq.user);
      formDangKy.reset();
      bao(`Tạo tài khoản thành công! Trạm đã gửi email xác minh tới ${kq.user.email}. Bạn bấm vào link trong email để có thể bình luận nhé.`, 'tot');
      setTimeout(() => hop.close(), 4000);
    } catch (err) {
      bao(loiTiengViet(err));
    } finally {
      dangCho(nut, false);
    }
  });
}

// Đầu trang: nút "Đăng nhập" hoặc ảnh đại diện
const o = document.getElementById('o-tai-khoan');
if (o) {
  const nutDangNhap = o.querySelector<HTMLElement>('[data-mo-dang-nhap]')!;
  const anh = o.querySelector<HTMLAnchorElement>('.anh-dai-dien')!;
  theoDoiDangNhap((u) => {
    o.hidden = false;
    nutDangNhap.hidden = !!u;
    anh.hidden = !u;
    if (!u) return;
    const ten = tenHienThi(u);
    anh.title = `${ten} – Tài khoản của bạn`;
    anh.setAttribute('aria-label', anh.title);
    anh.replaceChildren();
    if (u.photoURL) {
      const img = document.createElement('img');
      img.src = u.photoURL;
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      anh.appendChild(img);
    } else {
      anh.textContent = ten.charAt(0).toUpperCase();
    }
  });
}
