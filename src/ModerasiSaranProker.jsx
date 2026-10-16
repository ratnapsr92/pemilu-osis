import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const formatWaktu = (t) => new Date(t).toLocaleString('id-ID', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
})
const labelStatus = { menunggu: '⏳ Menunggu', disetujui: '✅ Tampil', ditolak: '❌ Ditolak' }

function ModerasiSaranProker() {
  const [daftar, setDaftar] = useState([])
  const [pesan, setPesan] = useState('')

  async function muat() {
    const { data, error } = await supabase.rpc('daftar_saran_proker')
    if (error) setPesan(error.message)
    else setDaftar(data || [])
  }
  useEffect(() => { muat() }, [])

  async function putuskan(s, setuju) {
    const { error } = await supabase.rpc('putuskan_saran_proker', { p_id: s.id, p_setuju: setuju })
    if (error) window.alert(error.message)
    else muat()
  }

  const menunggu = daftar.filter((s) => s.status === 'menunggu')
  const riwayat = daftar.filter((s) => s.status !== 'menunggu')

  return (
    <section className="kartu" style={{ maxWidth: '760px', margin: '24px auto 0', padding: '16px', textAlign: 'left' }}>
      <h3 style={{ marginTop: 0 }}>💬 Kritik & Saran Proker</h3>
      <p style={{ fontSize: '14px', color: '#666' }}>
        Nama pengirim hanya terlihat di sini. Di halaman publik dan bagi pengurus hanya tampil kelasnya.
      </p>
      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}

      <h4>Menunggu ditinjau ({menunggu.length})</h4>
      {menunggu.length === 0 && <p style={{ fontSize: '14px' }}>Tidak ada kiriman baru.</p>}
      {menunggu.map((s) => (
        <div key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>
            {s.organisasi} · <b>{s.proker}</b> · dari {s.nama}{s.kelas && ` (${s.kelas})`} · {formatWaktu(s.dibuat_pada)}
          </div>
          <div style={{ whiteSpace: 'pre-line', margin: '4px 0 8px' }}>{s.isi}</div>
          <button onClick={() => putuskan(s, true)} style={{ background: '#16a34a', marginRight: '8px' }}>✅ Tampilkan</button>
          <button onClick={() => putuskan(s, false)} style={{ background: '#dc2626' }}>❌ Tolak</button>
        </div>
      ))}

      {riwayat.length > 0 && (
        <details style={{ marginTop: '16px' }}>
          <summary style={{ cursor: 'pointer' }}>Riwayat keputusan ({riwayat.length})</summary>
          {riwayat.map((s) => (
            <div key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee', fontSize: '14px' }}>
              <b>{labelStatus[s.status]}</b> · {s.organisasi} · {s.proker} · {s.nama}: {s.isi}{' '}
              <button className="tombol-kedua" onClick={() => putuskan(s, s.status !== 'disetujui')}
                style={{ fontSize: '12px', padding: '2px 8px' }}>
                {s.status === 'disetujui' ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
          ))}
        </details>
      )}
    </section>
  )
}

export default ModerasiSaranProker