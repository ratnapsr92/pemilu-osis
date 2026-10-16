import { useState } from 'react'
import { supabase } from './supabase'

const formatWaktu = (t) => new Date(t).toLocaleString('id-ID', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
})
const labelStatus = { menunggu: '⏳ Menunggu peninjauan panitia', ditolak: '❌ Tidak ditampilkan' }

function UmpanBalikProker({ prokerId, ringkasan, saranPublik, saranSaya, siswa, onMasuk, onBerubah }) {
  const [buka, setBuka] = useState(false)
  const [isi, setIsi] = useState('')
  const [pesan, setPesan] = useState('')
  const [sibuk, setSibuk] = useState(false)
  const jumlah = ringkasan?.jempol ?? 0
  const saya = ringkasan?.saya ?? false

  async function jempol() {
    if (!siswa) {
      onMasuk()
      return
    }
    setSibuk(true)
    const { error } = await supabase.rpc('ubah_jempol_proker', { p_proker: prokerId })
    setSibuk(false)
    if (error) window.alert(error.message)
    else onBerubah()
  }

  async function kirim(e) {
    e.preventDefault()
    setPesan('')
    setSibuk(true)
    const { data, error } = await supabase.rpc('kirim_saran_proker', { p_proker: prokerId, p_isi: isi })
    setSibuk(false)
    if (error) setPesan(error.message)
    else {
      setIsi('')
      setPesan(data)
      onBerubah()
    }
  }
    return (
    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={jempol} disabled={sibuk} className={saya ? '' : 'tombol-kedua'}>
          👍 {saya ? 'Kamu suka' : 'Suka'}
        </button>
        <span style={{ fontSize: '14px', color: '#666' }}>{jumlah} siswa menyukai</span>
        <span style={{ flex: 1 }} />
        <button className="tombol-kedua" onClick={() => setBuka(!buka)}>
          💬 Kritik & Saran ({saranPublik.length})
        </button>
      </div>

      {buka && (
        <div style={{ marginTop: '12px' }}>
          {siswa ? (
            <form onSubmit={kirim}>
              <textarea value={isi} onChange={(e) => setIsi(e.target.value)} maxLength={300} rows={3} required
                placeholder="Tulis kritik atau saran yang sopan dan membangun untuk program ini..."
                style={{ display: 'block', width: '100%', padding: '10px', fontSize: '15px', borderRadius: '10px',
                  border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {isi.length}/300 · Ditinjau panitia dulu. Di publik hanya tampil kelasmu, bukan namamu.
                </span>
                <button type="submit" disabled={sibuk}>{sibuk ? 'Mengirim...' : 'Kirim'}</button>
              </div>
              {pesan && <p style={{ fontSize: '14px' }}>{pesan}</p>}
            </form>
          ) : (
            <p style={{ fontSize: '14px' }}>
              <button className="tombol-kedua" onClick={onMasuk}>Masuk sebagai siswa</button>{' '}
              untuk memberi jempol dan kritik/saran.
            </p>
          )}

          {saranSaya.map((c) => (
            <div key={c.id} style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: '10px', marginTop: '6px' }}>
              <div style={{ fontSize: '12px', color: '#666' }}>Kirimanmu · {labelStatus[c.status]} · {formatWaktu(c.dibuat_pada)}</div>
              <div>{c.isi}</div>
            </div>
          ))}

          {saranPublik.length === 0 && <p style={{ fontSize: '14px', color: '#666' }}>Belum ada kritik dan saran.</p>}
          {saranPublik.map((c) => (
            <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <div style={{ fontSize: '13px', color: '#666' }}>
                <b>Siswa{c.kelas ? ` kelas ${c.kelas}` : ''}</b> · {formatWaktu(c.dibuat_pada)}
              </div>
              <div style={{ whiteSpace: 'pre-line' }}>{c.isi}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UmpanBalikProker