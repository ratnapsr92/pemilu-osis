import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const formatWaktu = (t) => new Date(t).toLocaleString('id-ID', {
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta',
})

function LogAktivitas() {
  const [log, setLog] = useState([])
  const [pesan, setPesan] = useState('')

  async function muat() {
    const { data, error } = await supabase.rpc('daftar_log', { p_batas: 300 })
    if (error) setPesan(error.message)
    else setLog(data)
  }

  useEffect(() => {
    muat()
  }, [])

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'left' }}>
      <h2 style={{ textAlign: 'center' }}>Log Aktivitas</h2>
      <p style={{ fontSize: '14px', color: '#666' }}>
        Semua tindakan penting tercatat otomatis dan tidak dapat diubah atau dihapus. Menampilkan 300 catatan terbaru.
      </p>
      <button className="tombol-kedua" onClick={muat} style={{ marginBottom: '12px' }}>↻ Muat ulang</button>
      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}

      <div className="kartu">
        {log.map((l, i) => (
          <div key={i} style={{
            padding: '10px 14px', borderBottom: '1px solid #eee',
            background: l.aksi.startsWith('⚠️') || l.aksi.startsWith('⛔') ? '#fef2f2' : 'transparent'
          }}>
            <div style={{ fontSize: '12px', color: '#666' }}>{formatWaktu(l.waktu)} · {l.pelaku}</div>
            <div><b>{l.aksi}</b>{l.detail && ` — ${l.detail}`}</div>
          </div>
        ))}
        {log.length === 0 && !pesan && <p style={{ padding: '14px' }}>Belum ada catatan.</p>}
      </div>
    </div>
  )
}

export default LogAktivitas