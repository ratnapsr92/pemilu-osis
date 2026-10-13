import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const formatWaktu = (t) => new Date(t).toLocaleString('id-ID', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
})
const labelStatus = { menunggu: '⏳ Menunggu peninjauan panitia', ditolak: '❌ Tidak ditampilkan' }

function DukunganKomentar({ k, siswa, onMasuk }) {
  const [dukung, setDukung] = useState({ saya: false, jumlah: null, terbuka: true })
  const [komentar, setKomentar] = useState([])
  const [milikSaya, setMilikSaya] = useState([])
  const [isi, setIsi] = useState('')
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(false)

  async function muat() {
    const { data: d } = await supabase.rpc('status_dukungan', { p_kandidat_id: k.id })
    if (d) setDukung(d)
    const { data: kp } = await supabase.rpc('komentar_publik', { p_kandidat_id: k.id })
    setKomentar(kp || [])
    if (siswa) {
      const { data: ks } = await supabase.rpc('komentar_saya', { p_kandidat_id: k.id })
      setMilikSaya(ks || [])
    }
  }

  useEffect(() => {
    muat()
  }, [k.id, siswa])

  async function klikDukung() {
    if (!siswa) {
      onMasuk()
      return
    }
    setLoading(true)
    const { data, error } = await supabase.rpc('ubah_dukungan', { p_kandidat_id: k.id })
    setLoading(false)
    if (error) window.alert(error.message)
    else if (!data.ok) window.alert(data.pesan)
    else setDukung({ ...dukung, saya: data.saya })
  }

  async function kirim(e) {
    e.preventDefault()
    setPesan('')
    setLoading(true)
    const { data, error } = await supabase.rpc('kirim_komentar', { p_kandidat_id: k.id, p_isi: isi })
    setLoading(false)
    if (error) setPesan(error.message)
    else if (!data.ok) setPesan(data.pesan)
    else {
      setIsi('')
      setPesan(data.pesan)
      muat()
    }
  }
    return (
    <section className="kartu" style={{ padding: '20px', marginTop: '24px' }}>
      <h3 style={{ marginTop: 0 }}>Dukungan & Komentar</h3>

      {/* Tombol dukung */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={klikDukung} disabled={loading || !dukung.terbuka}
          className={dukung.saya ? '' : 'tombol-kedua'} style={{ fontSize: '17px', padding: '12px 22px' }}>
          {dukung.saya ? '👍 Kamu mendukung' : '👍 Dukung'}
        </button>
        <span style={{ fontSize: '14px', color: 'var(--teks-redup)' }}>
          {dukung.jumlah !== null && dukung.jumlah !== undefined
            ? `${dukung.jumlah} dukungan`
            : 'Jumlah dukungan dirahasiakan sampai hasil pemilu diumumkan.'}
        </span>
      </div>

      {/* Form komentar */}
      {siswa ? (
        <form onSubmit={kirim} style={{ marginTop: '18px' }}>
          <textarea value={isi} onChange={(e) => setIsi(e.target.value)} maxLength={300} rows={3} required
            placeholder="Tulis komentar yang sopan dan membangun..."
            style={{ display: 'block', width: '100%', padding: '10px', fontSize: '15px', borderRadius: '10px',
              border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--teks-redup)' }}>
              {isi.length}/300 · Ditinjau panitia sebelum tampil. Identitas pengirim tercatat.
            </span>
            <button type="submit" disabled={loading}>{loading ? 'Mengirim...' : 'Kirim Komentar'}</button>
          </div>
          {pesan && <p style={{ fontSize: '14px' }}>{pesan}</p>}
        </form>
      ) : (
        <p style={{ marginTop: '18px', fontSize: '14px' }}>
          <button className="tombol-kedua" onClick={onMasuk}>Masuk sebagai siswa</button>{' '}
          untuk memberi dukungan dan komentar.
        </p>
      )}

      {/* Komentar milik siswa yang belum tampil */}
      {milikSaya.length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <div className="label-kecil">Komentarmu</div>
          {milikSaya.map((c) => (
            <div key={c.id} style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: '10px', marginBottom: '6px' }}>
              <div style={{ fontSize: '12px', color: 'var(--teks-redup)' }}>{labelStatus[c.status]} · {formatWaktu(c.dibuat_pada)}</div>
              <div>{c.isi}</div>
            </div>
          ))}
        </div>
      )}

      {/* Komentar publik */}
      <div style={{ marginTop: '18px' }}>
        <div className="label-kecil">Komentar ({komentar.length})</div>
        {komentar.length === 0 && <p style={{ fontSize: '14px', color: 'var(--teks-redup)' }}>Belum ada komentar.</p>}
        {komentar.map((c) => (
          <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--garis)' }}>
            <div style={{ fontSize: '13px' }}>
              <b>{c.nama}</b>{c.kelas && ` (${c.kelas})`}{' '}
              <span style={{ color: 'var(--teks-redup)' }}>· {formatWaktu(c.dibuat_pada)}</span>
            </div>
            <div style={{ whiteSpace: 'pre-line' }}>{c.isi}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default DukunganKomentar