import { useState } from 'react'
import { supabase } from './supabase'

const KOLOM = {
  nomor: ['no', 'nomor', 'no absen', 'nomor absen', 'absen'],
  nis: ['nis'],
  nama: ['nama', 'nama lengkap', 'nama siswa'],
  kelas: ['kelas', 'rombel'],
}

function ambilKolom(baris, daftarNama) {
  for (const k of Object.keys(baris)) {
    const bersih = k.toString().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim()
    if (daftarNama.includes(bersih)) return String(baris[k]).trim()
  }
  return ''
}

const sel = { padding: '6px 8px', borderBottom: '1px solid #eee', fontSize: '14px', textAlign: 'left' }

function ImporPemilihExcel({ onSelesai }) {
  const [data, setData] = useState([])
  const [sibuk, setSibuk] = useState(false)
  const [progres, setProgres] = useState('')

  async function unduhTemplate() {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.aoa_to_sheet([['Nomor Absen', 'NIS', 'Nama Lengkap', 'Kelas']])
    ws['!cols'] = [{ wch: 13 }, { wch: 14 }, { wch: 34 }, { wch: 8 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data Pemilih')
    XLSX.writeFile(wb, 'template-data-pemilih.xlsx')
  }

  async function bacaFile(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.read(await file.arrayBuffer())
      const ws = wb.Sheets[wb.SheetNames[0]]
      const baris = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false })
      const nisDilihat = new Set()
      const hasil = []
      baris.forEach((b, i) => {
        const d = {
          baris: i + 2,
          nomor: ambilKolom(b, KOLOM.nomor),
          nis: ambilKolom(b, KOLOM.nis),
          nama: ambilKolom(b, KOLOM.nama),
          kelas: ambilKolom(b, KOLOM.kelas),
          masalah: '',
        }
        if (!d.nis && !d.nama) return
        if (!d.nis) d.masalah = 'NIS kosong'
        else if (!d.nama) d.masalah = 'Nama kosong'
        else if (d.nomor && !/^\d+$/.test(d.nomor)) d.masalah = 'Nomor absen harus angka'
        else if (nisDilihat.has(d.nis)) d.masalah = 'NIS ganda di file'
        nisDilihat.add(d.nis)
        hasil.push(d)
      })
      if (hasil.length === 0) {
        window.alert('Tidak ada data terbaca.\nPastikan baris pertama berisi judul kolom: Nomor Absen, NIS, Nama Lengkap, Kelas.')
        return
      }
            const nisCek = hasil.filter((d) => !d.masalah).map((d) => d.nis)
      const { data: ada, error: errAda } = await supabase.rpc('nis_terdaftar', { p_nis: nisCek })
      if (errAda) {
        window.alert('Gagal mengecek data lama: ' + errAda.message)
        return
      }
      const { data: usulanLama } = await supabase.rpc('daftar_usulan')
      const sudahAda = new Set((ada ?? []).map(String))
      const menunggu = new Set((usulanLama ?? [])
        .filter((u) => u.jenis === 'tambah' && u.status === 'menunggu')
        .map((u) => String(u.nis)))
      hasil.forEach((d) => {
        if (d.masalah) return
        if (sudahAda.has(d.nis)) d.masalah = 'Sudah terdaftar di aplikasi'
        else if (menunggu.has(d.nis)) d.masalah = 'Sudah diusulkan, menunggu KPU'
      })
      setData(hasil)
    } catch (err) {
      window.alert('File tidak bisa dibaca. Pastikan formatnya .xlsx.\n' + err.message)
    }
  }
    async function kirimSemua() {
    const siap = data.filter((d) => !d.masalah)
    if (siap.length === 0) return
    if (!window.confirm(`Kirim ${siap.length} usulan pemilih baru ke Ketua KPU?`)) return
    setSibuk(true)
    const gagal = []
    for (let i = 0; i < siap.length; i++) {
      const d = siap[i]
      setProgres(`Mengirim ${i + 1} dari ${siap.length}...`)
      const { error } = await supabase.rpc('usulkan_pemilih', {
        p_jenis: 'tambah', p_pemilih_id: null,
        p_nis: d.nis, p_nama: d.nama, p_kelas: d.kelas,
        p_nomor: d.nomor === '' ? null : Number(d.nomor),
      })
      if (error) gagal.push({ ...d, masalah: error.message })
    }
    setSibuk(false)
    setProgres('')
    const masalahLama = data.filter((d) => d.masalah)
    setData([...masalahLama, ...gagal])
    window.alert(`${siap.length - gagal.length} usulan terkirim ke Ketua KPU.` +
      (gagal.length + masalahLama.length > 0 ? `\n${gagal.length + masalahLama.length} baris belum terkirim, lihat daftar di bawah.` : ''))
    onSelesai()
  }

  const jumlahSiap = data.filter((d) => !d.masalah).length

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '16px', marginBottom: '16px', background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>📥 Impor dari Excel</h3>
      <p style={{ fontSize: '14px', color: '#666', marginTop: 0 }}>
        Unduh template, isi mulai baris ke-2 (satu siswa per baris), simpan, lalu pilih filenya.
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button type="button" className="tombol-kedua" onClick={unduhTemplate}>⬇️ Unduh Template Excel</button>
        <label className="tombol-kedua" style={{ cursor: 'pointer', padding: '10px 16px', borderRadius: '10px', border: '1px solid #ccc' }}>
          📂 Pilih File Excel
          <input type="file" accept=".xlsx,.xls" onChange={bacaFile} style={{ display: 'none' }} disabled={sibuk} />
        </label>
      </div>

      {data.length > 0 && (
        <>
          <p style={{ marginBottom: '6px' }}>
            <b>{jumlahSiap}</b> baris siap dikirim · <b style={{ color: '#b45309' }}>{data.length - jumlahSiap}</b> bermasalah
          </p>
          <div style={{ maxHeight: '320px', overflow: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f5f3ff', position: 'sticky', top: 0 }}>
                <tr><th style={sel}>Baris</th><th style={sel}>No</th><th style={sel}>NIS</th><th style={sel}>Nama</th><th style={sel}>Kelas</th><th style={sel}>Status</th></tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.baris} style={{ background: d.masalah ? '#fff7ed' : 'transparent' }}>
                    <td style={sel}>{d.baris}</td><td style={sel}>{d.nomor || '-'}</td><td style={sel}>{d.nis}</td>
                    <td style={sel}>{d.nama}</td><td style={sel}>{d.kelas}</td>
                    <td style={sel}>{d.masalah ? `⚠️ ${d.masalah}` : '✅'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {progres && <p>{progres}</p>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button type="button" onClick={kirimSemua} disabled={sibuk || jumlahSiap === 0}>
              {sibuk ? 'Mengirim...' : `Kirim ${jumlahSiap} Usulan ke Ketua KPU`}
            </button>
            <button type="button" className="tombol-kedua" onClick={() => setData([])} disabled={sibuk}>Batal</button>
          </div>
        </>
      )}
    </section>
  )
}

export default ImporPemilihExcel