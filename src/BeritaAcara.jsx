import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const NAMA_SEKOLAH = 'UPT SMP Negeri 2 Semanding'
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
  'Agustus', 'September', 'Oktober', 'November', 'Desember']
const ANGKA = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh',
  'delapan', 'sembilan', 'sepuluh', 'sebelas']

// Mengubah angka menjadi huruf, contoh: 2026 → "dua ribu dua puluh enam"
function terbilang(n) {
  if (n < 12) return ANGKA[n]
  if (n < 20) return terbilang(n - 10) + ' belas'
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' puluh' + (n % 10 ? ' ' + terbilang(n % 10) : '')
  if (n < 200) return 'seratus' + (n % 100 ? ' ' + terbilang(n % 100) : '')
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' ratus' + (n % 100 ? ' ' + terbilang(n % 100) : '')
  if (n < 2000) return 'seribu' + (n % 1000 ? ' ' + terbilang(n % 1000) : '')
  return terbilang(Math.floor(n / 1000)) + ' ribu' + (n % 1000 ? ' ' + terbilang(n % 1000) : '')
}

function aman(teks) {
  return String(teks ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const gayaInput = {
  display: 'block', width: '100%', padding: '10px', fontSize: '16px', marginBottom: '10px',
  borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box'
}
// Menyusun dokumen berita acara (HTML siap cetak)
function buatHtml({ org, rekap, hasil, pemenang, isian }) {
  const [y, m, d] = isian.tanggal.split('-').map(Number)
  const tgl = new Date(y, m - 1, d)
  const total = Number(rekap.total_pemilih)
  const hadir = Number(rekap.pengguna_hak_pilih)
  const persenHadir = total > 0 ? ((hadir / total) * 100).toFixed(1) : '0'
  const totalSuara = hasil.reduce((j, h) => j + Number(h.jumlah), 0)
  const asal = window.location.origin
  const saksi = isian.saksi.split('\n').map((s) => s.trim()).filter(Boolean)
  const judulOrg = org.nama.toUpperCase()
  const sekolahBesar = NAMA_SEKOLAH.toUpperCase()

  const barisSuara = hasil.map((h) => {
    const persen = totalSuara > 0 ? ((Number(h.jumlah) / totalSuara) * 100).toFixed(1) : '0'
    const wakil = h.nama_wakil ? `<br><small>Wakil: ${aman(h.nama_wakil)}</small>` : ''
    return `<tr><td class="tengah">${h.nomor_urut}</td><td>${aman(h.nama_ketua)}${wakil}</td>
      <td class="tengah">${h.jumlah}</td><td class="tengah">${persen}%</td></tr>`
  }).join('')

  const barisSaksi = saksi.map((s, i) => `<tr><td style="width:6%">${i + 1}.</td>
    <td style="width:50%">${aman(s)}</td>
    <td style="padding-left:${i % 2 === 0 ? 0 : 80}px">${i + 1}. ..............................</td></tr>`).join('')

  const teksPemenang = pemenang
    ? `Berdasarkan hasil perolehan suara tersebut, <b>${aman(pemenang.nama_ketua)}</b>${pemenang.nama_wakil ? ` dan <b>${aman(pemenang.nama_wakil)}</b>` : ''} (nomor urut ${pemenang.nomor_urut}) ditetapkan sebagai Ketua${pemenang.nama_wakil ? ' dan Wakil Ketua' : ''} ${aman(org.nama)} ${NAMA_SEKOLAH} masa bakti ${aman(isian.tahunPelajaran)}.`
    : 'Pemenang belum dapat ditetapkan karena terdapat perolehan suara yang sama.'

  return `<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>Berita Acara Pemilihan ${aman(org.nama)}</title>
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5; color: #000; }
  .kop { display: flex; align-items: center; justify-content: space-between;
         border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 16px; }
  .kop img { width: 80px; height: 80px; object-fit: contain; }
  .kop .teks { text-align: center; flex: 1; padding: 0 8px; }
  .kop .besar { font-size: 14pt; font-weight: bold; }
  h1 { font-size: 13pt; text-align: center; margin: 8px 0 16px; line-height: 1.4; }
  table.data { width: 100%; border-collapse: collapse; margin: 6px 0 12px; }
  table.data th, table.data td { border: 1px solid #000; padding: 4px 8px; vertical-align: top; }
  .tengah { text-align: center; }
  p { text-align: justify; margin: 6px 0; }
  .ttd { margin-top: 20px; page-break-inside: avoid; }
  .kanan { width: 45%; margin-left: 55%; text-align: center; }
  table.saksi { width: 100%; margin: 8px 0; }
  table.saksi td { padding: 12px 4px; }
  .mengetahui { text-align: center; margin-top: 20px; }
  .ruang { height: 70px; }
</style></head><body>
<div class="kop">
  <img src="${asal}/logo/sekolah.png" alt="">
  <div class="teks">
    <div class="besar">PANITIA PEMILIHAN ${judulOrg}</div>
    <div class="besar">${sekolahBesar}</div>
    ${isian.alamat ? `<div>${aman(isian.alamat)}</div>` : ''}
  </div>
  ${org.logo ? `<img src="${asal}${org.logo}" alt="">` : '<span style="width:80px"></span>'}
</div>

<h1>BERITA ACARA<br>PEMILIHAN KETUA ${judulOrg}<br>${sekolahBesar}<br>TAHUN PELAJARAN ${aman(isian.tahunPelajaran)}</h1>

<p>Pada hari ini <b>${HARI[tgl.getDay()]}</b> tanggal <b>${terbilang(d)}</b> bulan <b>${BULAN[m - 1]}</b>
tahun <b>${terbilang(y)}</b> (${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}),
bertempat di ${aman(isian.tempat)}, telah dilaksanakan Pemilihan Ketua ${aman(org.nama)} ${NAMA_SEKOLAH}
Tahun Pelajaran ${aman(isian.tahunPelajaran)} secara langsung, umum, bebas, dan rahasia menggunakan
bilik suara digital melalui aplikasi PILANG (Pilihan Langsung), dengan hasil sebagai berikut:</p>

<p><b>A. Data Pemilih</b></p>
<table class="data">
  <tr><td>Jumlah pemilih terdaftar</td><td class="tengah" style="width:30%">${total} orang</td></tr>
  <tr><td>Pemilih yang menggunakan hak pilih</td><td class="tengah">${hadir} orang</td></tr>
  <tr><td>Pemilih yang tidak menggunakan hak pilih</td><td class="tengah">${total - hadir} orang</td></tr>
  <tr><td>Tingkat partisipasi</td><td class="tengah">${persenHadir}%</td></tr>
</table>

<p><b>B. Perolehan Suara</b></p>
<table class="data">
  <tr><th style="width:12%">No. Urut</th><th>Nama Kandidat</th><th style="width:18%">Jumlah Suara</th><th style="width:16%">Persentase</th></tr>
  ${barisSuara}
  <tr><td colspan="2"><b>Jumlah suara sah</b></td><td class="tengah"><b>${totalSuara}</b></td><td class="tengah">100%</td></tr>
  <tr><td colspan="2">Suara tidak sah</td><td class="tengah">0</td><td class="tengah">0%</td></tr>
</table>

<p><b>C. Penetapan</b></p>
<p>${teksPemenang}</p>
<p>Demikian berita acara ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

<div class="ttd">
  <div class="kanan">${aman(isian.kota)}, ${d} ${BULAN[m - 1]} ${y}<br>Ketua Panitia,
    <div class="ruang"></div><b><u>${aman(isian.ketuaPanitia) || '..............................'}</u></b></div>
  ${saksi.length ? `<p><b>Saksi-saksi:</b></p><table class="saksi">${barisSaksi}</table>` : ''}
  <div class="mengetahui">Mengetahui,<br>Kepala ${NAMA_SEKOLAH}
    <div class="ruang"></div><b><u>${aman(isian.kepsek) || '..............................'}</u></b>
    <br>NIP. ${aman(isian.nipKepsek) || '..............................'}</div>
</div>
<script>window.onload = function () { window.print() }</script>
</body></html>`
}
function BeritaAcara() {
  const hariIni = new Date()
  const [organisasi, setOrganisasi] = useState([])
  const [pesan, setPesan] = useState('')
  const [isian, setIsian] = useState({
    tanggal: `${hariIni.getFullYear()}-${String(hariIni.getMonth() + 1).padStart(2, '0')}-${String(hariIni.getDate()).padStart(2, '0')}`,
    tempat: NAMA_SEKOLAH,
    kota: 'Semanding',
    tahunPelajaran: '2026/2027',
    alamat: '',
    ketuaPanitia: '',
    saksi: '',
    kepsek: '',
    nipKepsek: '',
  })

  useEffect(() => {
    supabase.from('organisasi').select('id, nama, logo').order('urutan')
      .then(({ data }) => {
        if (data) setOrganisasi(data)
      })
  }, [])

  function ubah(kolom) {
    return (e) => setIsian({ ...isian, [kolom]: e.target.value })
  }

  async function cetak(org) {
    setPesan('')
    const jendela = window.open('', '_blank')
    if (!jendela) {
      setPesan('Jendela cetak diblokir browser. Izinkan pop-up untuk situs ini, lalu coba lagi.')
      return
    }

    const { data: rekap, error: e1 } = await supabase.rpc('rekap_organisasi')
    const { data: hasilSemua, error: e2 } = await supabase.rpc('hasil_suara')
    if (e1 || e2) {
      jendela.close()
      setPesan((e1 || e2).message)
      return
    }

    const { data: kandidat } = await supabase.from('kandidat')
      .select('id, nama_wakil').eq('organisasi_id', org.id)
    const { data: kp } = await supabase.from('kepengurusan')
      .select('kandidat_id').eq('organisasi_id', org.id)
      .order('mulai', { ascending: false }).limit(1)

    const r = rekap.find((x) => x.organisasi_id === org.id)
    const hasil = hasilSemua
      .filter((h) => h.nama_organisasi === org.nama)
      .map((h) => ({ ...h, nama_wakil: (kandidat || []).find((k) => k.id === h.kandidat_id)?.nama_wakil }))

    // Pemenang: yang sudah ditetapkan panitia, atau suara terbanyak (jika tidak seri)
    let pemenang = null
    if (kp && kp.length > 0) pemenang = hasil.find((h) => h.kandidat_id === kp[0].kandidat_id) || null
    if (!pemenang && hasil.length > 0) {
      const urut = [...hasil].sort((a, b) => Number(b.jumlah) - Number(a.jumlah))
      if (urut.length === 1 || Number(urut[0].jumlah) > Number(urut[1].jumlah)) pemenang = urut[0]
    }

    jendela.document.write(buatHtml({ org, rekap: r, hasil, pemenang, isian }))
    jendela.document.close()
  }

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
      <h3>Berita Acara</h3>
      <p style={{ fontSize: '14px', color: '#666' }}>
        Lengkapi data berikut, lalu klik tombol cetak. Di jendela cetak, pilih "Simpan sebagai PDF" untuk menyimpan file.
      </p>

      <label>Tanggal pelaksanaan</label>
      <input type="date" value={isian.tanggal} onChange={ubah('tanggal')} style={gayaInput} />
      <label>Tempat pelaksanaan</label>
      <input value={isian.tempat} onChange={ubah('tempat')} style={gayaInput} />
      <label>Kota (untuk tanggal tanda tangan)</label>
      <input value={isian.kota} onChange={ubah('kota')} style={gayaInput} />
      <label>Tahun pelajaran</label>
      <input value={isian.tahunPelajaran} onChange={ubah('tahunPelajaran')} style={gayaInput} />
      <label>Alamat sekolah (opsional, untuk kop)</label>
      <input value={isian.alamat} onChange={ubah('alamat')} style={gayaInput} />
      <label>Nama ketua panitia</label>
      <input value={isian.ketuaPanitia} onChange={ubah('ketuaPanitia')} style={gayaInput} />
      <label>Saksi-saksi (satu nama per baris)</label>
      <textarea rows={4} value={isian.saksi} onChange={ubah('saksi')} style={gayaInput}
        placeholder={'Nama Saksi 1\nNama Saksi 2\nNama Saksi 3'} />
      <label>Nama kepala sekolah</label>
      <input value={isian.kepsek} onChange={ubah('kepsek')} style={gayaInput} />
      <label>NIP kepala sekolah</label>
      <input value={isian.nipKepsek} onChange={ubah('nipKepsek')} style={gayaInput} />

      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        {organisasi.map((o) => (
          <button key={o.id} onClick={() => cetak(o)}>🖨 Cetak Berita Acara {o.nama}</button>
        ))}
      </div>
    </section>
  )
}

export default BeritaAcara