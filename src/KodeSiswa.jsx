import { useState } from 'react'
import { supabase } from './supabase'

const gayaInput = {
  display: 'block', width: '100%', padding: '10px', fontSize: '16px', marginBottom: '10px',
  borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit'
}

function KodeSiswa() {
  const [kelas, setKelas] = useState('')
  const [nis, setNis] = useState('')
  const [ulang, setUlang] = useState(false)
  const [hasil, setHasil] = useState([])
  const [loading, setLoading] = useState(false)

  async function buat(e) {
    e.preventDefault()
    let teks
    if (nis.trim()) teks = `Buat kode BARU untuk NIS ${nis.trim()}? Kode lamanya tidak berlaku lagi.`
    else if (ulang) teks = `Buat ULANG kode untuk ${kelas.trim() || 'SEMUA kelas'}? Semua kode lama tidak berlaku lagi.`
    else teks = `Buat kode untuk siswa ${kelas.trim() || 'semua kelas'} yang belum punya kode?`
    if (!window.confirm(teks)) return

    setLoading(true)
    const { data, error } = await supabase.rpc('buat_kode_siswa', {
      p_kelas: kelas.trim() || null, p_nis: nis.trim() || null, p_ulang: ulang,
    })
    setLoading(false)
    if (error) return window.alert(error.message)
    setHasil(data)
    if (data.length === 0) window.alert('Tidak ada siswa yang perlu dibuatkan kode.')
  }

  function unduh() {
    const baris = [['No. Absen', 'NIS', 'Nama', 'Kelas', 'Kode'],
      ...hasil.map((h) => [h.nomor_absen ?? '', `="${h.nis}"`, h.nama, h.kelas ?? '', h.kode])]
    const berkas = new Blob(['\uFEFF' + baris.map((b) => b.join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const alamat = URL.createObjectURL(berkas)
    const tautan = document.createElement('a')
    tautan.href = alamat
    tautan.download = `kode-siswa-${kelas.trim() || 'semua'}.csv`
    tautan.click()
    setTimeout(() => URL.revokeObjectURL(alamat), 1000)
  }
    return (
    <section className="kartu" style={{ padding: '16px', marginTop: '24px', textAlign: 'left' }}>
      <h3 style={{ marginTop: 0 }}>🔑 Kode Login Siswa</h3>
      <p style={{ fontSize: '14px', color: '#666' }}>
        Siswa login dengan NIS + kode untuk memberi dukungan dan komentar.
        Kode <b>hanya ditampilkan sekali</b>. Langsung unduh, lalu bagikan secara pribadi lewat wali kelas.
      </p>
      <form onSubmit={buat}>
        <label>Kelas (kosongkan untuk semua kelas)</label>
        <input value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="Contoh: 7A" style={gayaInput} />
        <label>Atau satu siswa saja: NIS (untuk siswa yang lupa kode)</label>
        <input value={nis} onChange={(e) => setNis(e.target.value)} placeholder="Kosongkan jika per kelas" style={gayaInput} />
        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <input type="checkbox" checked={ulang} onChange={(e) => setUlang(e.target.checked)} />
          Buat ulang untuk yang sudah punya kode (kode lama tidak berlaku)
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Membuat...' : 'Buat Kode'}</button>
      </form>

      {hasil.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px', fontSize: '14px' }}>
            ⚠️ {hasil.length} kode dibuat. <b>Unduh sekarang</b>. Setelah halaman ditutup, kode tidak bisa dilihat lagi.
          </p>
          <button onClick={unduh} style={{ marginBottom: '12px' }}>⬇ Unduh Daftar Kode (Excel)</button>
          {hasil.map((h) => (
            <div key={h.nis} style={{ padding: '6px 0', borderBottom: '1px solid #eee', fontSize: '14px' }}>
              {h.nomor_absen && `No. ${h.nomor_absen} · `}{h.nis} – {h.nama} {h.kelas && `(${h.kelas})`} ·{' '}
              <b style={{ fontFamily: 'monospace', fontSize: '16px', letterSpacing: '2px' }}>{h.kode}</b>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default KodeSiswa