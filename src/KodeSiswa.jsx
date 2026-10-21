import { useState } from 'react'
import { supabase } from './supabase'

const gayaInput = {
  display: 'block', width: '100%', padding: '10px', fontSize: '16px', marginBottom: '10px',
  borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit'
}
const gayaKotak = { background: '#f9fafb', border: '1px solid #eee', borderRadius: '10px', padding: '14px', marginBottom: '14px' }

function KodeSiswa() {
  const [kelas, setKelas] = useState('')
  const [ulang, setUlang] = useState(false)
  const [kata, setKata] = useState('')
  const [temuan, setTemuan] = useState(null)
  const [hasil, setHasil] = useState([])
  const [loading, setLoading] = useState(false)
  const [yakin, setYakin] = useState(null)
  const [pesan, setPesan] = useState('')
    async function buatMassal(e) {
    e.preventDefault()
    const teks = ulang
      ? `Buat ULANG kode untuk ${kelas.trim() || 'SEMUA kelas'}?\nSemua kode lama mereka tidak berlaku lagi.`
      : `Buat kode untuk siswa ${kelas.trim() || 'semua kelas'} yang belum punya kode?`
    if (!window.confirm(teks)) return
    setLoading(true)
    const { data, error } = await supabase.rpc('buat_kode_siswa', {
      p_kelas: kelas.trim() || null, p_nis: null, p_ulang: ulang,
    })
    setLoading(false)
    if (error) return window.alert(error.message)
    setHasil(data)
    if (data.length === 0) window.alert('Semua siswa sudah punya kode. Centang "Buat ulang" jika ingin mengganti semua kode.')
  }

  async function cari(e) {
    e.preventDefault()
    setPesan('')
    setYakin(null)
    if (kata.trim().length < 2) return setPesan('Ketik minimal 2 huruf nama atau NIS.')
    const { data, error } = await supabase.rpc('daftar_pemilih_admin', { p_kata: kata.trim() })
    if (error) return setPesan('Gagal mencari: ' + error.message)
    setTemuan((data || []).slice(0, 10))
  }

  async function buatSatu(p) {
    setLoading(true)
    setPesan('')
    const { data, error } = await supabase.rpc('buat_kode_siswa', { p_kelas: null, p_nis: String(p.nis), p_ulang: true })
    setLoading(false)
    setYakin(null)
    if (error) return setPesan('Gagal: ' + error.message)
    if (!data || data.length === 0) return setPesan(`Kode untuk NIS ${p.nis} tidak terbentuk (database tidak mengembalikan data).`)
    setHasil(data)
    setTemuan(null)
    setKata('')
    setPesan(`✅ Kode baru untuk ${p.nama} sudah dibuat. Lihat di bawah.`)
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
        Kode <b>hanya ditampilkan sekali</b>. Langsung unduh atau catat, lalu bagikan secara pribadi.
      </p>

      <form onSubmit={buatMassal} style={gayaKotak}>
        <b>👥 Per kelas atau semua siswa</b>
        <label style={{ display: 'block', marginTop: '8px' }}>Kelas (kosongkan untuk semua kelas)</label>
        <input value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="Contoh: 7A" style={gayaInput} />
        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <input type="checkbox" checked={ulang} onChange={(e) => setUlang(e.target.checked)} />
          Buat ulang untuk yang sudah punya kode (kode lama tidak berlaku)
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Membuat...' : 'Buat Kode'}</button>
      </form>

      <div style={gayaKotak}>
        <b>👤 Satu siswa (lupa kode)</b>
        <form onSubmit={cari} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <input value={kata} onChange={(e) => setKata(e.target.value)} placeholder="Ketik nama atau NIS siswa"
            style={{ ...gayaInput, marginBottom: 0, flex: 1 }} />
          <button type="submit" disabled={loading}>Cari</button>
        </form>
        {pesan && <p style={{ fontSize: '14px', fontWeight: 600 }}>{pesan}</p>}
        {temuan && temuan.length === 0 && <p style={{ fontSize: '14px' }}>Siswa tidak ditemukan.</p>}
        {temuan && temuan.map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px',
            flexWrap: 'wrap', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: '14px' }}>
            <span>{p.nis} – <b>{p.nama}</b>{p.kelas && ` (${p.kelas})`}</span>
            {yakin === p.id ? (
              <span style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: '#b45309' }}>Kode lama tidak berlaku. Yakin?</span>
                <button type="button" onClick={() => buatSatu(p)} disabled={loading}>{loading ? 'Membuat...' : 'Ya, buat'}</button>
                <button type="button" className="tombol-kedua" onClick={() => setYakin(null)} disabled={loading}>Batal</button>
              </span>
            ) : (
              <button type="button" className="tombol-kedua" onClick={() => { setPesan(''); setYakin(p.id) }}>🔄 Buat Kode Baru</button>
            )}
          </div>
        ))}
      </div>

      {hasil.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px', fontSize: '14px' }}>
            ⚠️ {hasil.length} kode dibuat. <b>Unduh atau catat sekarang</b>. Setelah halaman ditutup, kode tidak bisa dilihat lagi.
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