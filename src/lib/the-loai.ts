// Biểu tượng và màu riêng cho từng thể loại, dùng cho nút thể loại và bìa tự tạo
const BANG: Record<string, { icon: string; mau: [string, string] }> = {
  'ngôn tình': { icon: '💕', mau: ['#f472b6', '#be185d'] },
  'kinh dị': { icon: '👻', mau: ['#6d28d9', '#1e1b2e'] },
  'linh dị': { icon: '🕯️', mau: ['#7c3aed', '#2e1065'] },
  'tâm linh': { icon: '🔮', mau: ['#8b5cf6', '#312e81'] },
  'tiên hiệp': { icon: '☁️', mau: ['#38bdf8', '#1e40af'] },
  'kiếm hiệp': { icon: '⚔️', mau: ['#94a3b8', '#334155'] },
  'huyền huyễn': { icon: '🐉', mau: ['#f59e0b', '#9a3412'] },
  'đô thị': { icon: '🏙️', mau: ['#22d3ee', '#0e7490'] },
  'trinh thám': { icon: '🔍', mau: ['#64748b', '#0f172a'] },
  'xuyên không': { icon: '⏳', mau: ['#a78bfa', '#5b21b6'] },
  'cổ đại': { icon: '🏯', mau: ['#f87171', '#7f1d1d'] },
  'hiện đại': { icon: '📱', mau: ['#60a5fa', '#1d4ed8'] },
  'học đường': { icon: '🎒', mau: ['#4ade80', '#15803d'] },
  'hài hước': { icon: '😂', mau: ['#facc15', '#ca8a04'] },
  'khoa học viễn tưởng': { icon: '🚀', mau: ['#2dd4bf', '#134e4a'] },
  'phiêu lưu': { icon: '🧭', mau: ['#fb923c', '#c2410c'] },
  'truyện ngắn': { icon: '📄', mau: ['#a3a3a3', '#404040'] },
};

const MAC_DINH = { icon: '📖', mau: ['#d97745', '#7c2d12'] as [string, string] };

export function kieuTheLoai(ten?: string) {
  return (ten && BANG[ten.toLowerCase()]) || MAC_DINH;
}
