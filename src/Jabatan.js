// Sebutan jabatan per organisasi
// OSIS  : Ketua & Wakil Ketua
// Dewan : Ketua Putra & Ketua Putri
export function jabatan(namaOrg) {
  if (/dewan/i.test(namaOrg || '')) {
    return { ketua: 'Ketua Putra', wakil: 'Ketua Putri', judul: 'Ketua Putra dan Ketua Putri' }
  }
  return { ketua: 'Ketua', wakil: 'Wakil Ketua', judul: 'Ketua' }
}