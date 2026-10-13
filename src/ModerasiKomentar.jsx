import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const daftarTab = [
  { id: 'menunggu', label: '⏳ Menunggu' },
  { id: 'tampil', label: '✅ Tampil' },
  { id: 'ditolak', label: '❌ Ditolak' },
]
const formatWaktu = (t) => new Date(t).toLocaleString('id-ID', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
})

function ModerasiKomentar() {
  const [tab, setTab] = useState('menunggu')
  const [daftar, setDaftar] = useState([])
  const [dukungan, setDukungan] = useState([])
  const [pesan, setPesan] = useState('')

  async function muat() {
    setPesan('')
    const { data, error } = await supabase.rpc('daftar_komentar', { p_status: tab })
    if (error) setPesan(error.message)
    else setDaftar(data)
    const { data: d } = await supabase.rpc('jumlah_dukungan_admin')
    if (d) setDukungan(d)
  }

  useEffect(() => {
    muat()
  }, [tab])

  async function putuskan(c, tampil) {
    const { error } = await supabase.rpc('putuskan_komentar', { p_id: c.id, p_tampil: tampil })
    if (error) window.alert(error.message)
    else muat()
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'left' }}>
      <h2 style={{ textAlign: 'center' }}>Moderasi Komentar</h2>

      <div style={{ textAlign: 'center' }}>
        <div className="tab-pil">
          {daftarTab.map((t) => (
            <button key={t.id} className={tab === t.id ? 'aktif' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <button className="tombol-kedua" onClick={muat} style={{ marginBottom: '12px' }}>↻ Muat ulang</button>
      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}

      {daftar.length === 0 && <p>Tidak ada komentar.</p>}
      {daftar.map((c) => (
        <div key={c.id} className="kartu" style={{ padding: '14px', marginBottom: '10px' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>
            Untuk <b>{c.organisasi} · {c.kandidat}</b> · {formatWaktu(c.dibuat_pada)}
          </div>
          <div style={{ margin: '6px 0', whiteSpace: 'pre-line', fontSize: '16px' }}>{c.isi}</div>
          <div style={{ fontSize: '13px', background: '#f9fafb', padding: '6px 10px', borderRadius: '8px' }}>
            Pengirim: {c.nomor_absen && `No. ${c.nomor_absen} · `}{c.nis} · <b>{c.nama}</b>{c.kelas && ` (${c.kelas})`}
            {c.pemutus && ` · Diputuskan oleh ${c.pemutus}`}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {c.status !== 'tampil' && (
              <button onClick={() => putuskan(c, true)} style={{ background: '#16a34a' }}>✅ Tampilkan</button>
            )}
            {c.status !== 'ditolak' && (
              <button onClick={() => putuskan(c, false)} style={{ background: '#dc2626' }}>
                {c.status === 'tampil' ? 'Sembunyikan' : '❌ Tolak'}
              </button>
            )}
          </div>
        </div>
      ))}

      <section className="kartu" style={{ padding: '14px', marginTop: '24px' }}>
        <h3 style={{ marginTop: 0 }}>👍 Jumlah Dukungan (khusus panitia)</h3>
        <p style={{ fontSize: '13px', color: '#666' }}>
          Publik baru bisa melihat jumlah ini setelah hasil diumumkan. Nama pendukung tidak pernah ditampilkan.
        </p>
        {dukungan.map((d, i) => (
          <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>
            {d.nama_organisasi} · {d.nomor_urut}. {d.nama_ketua}: <b>{d.jumlah}</b>
          </div>
        ))}
      </section>
    </div>
  )
}

export default ModerasiKomentar