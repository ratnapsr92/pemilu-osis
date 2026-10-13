import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const gayaKotak = {
  border: '1px solid #ddd', borderRadius: '16px', padding: '20px', marginBottom: '16px',
  background: '#fff', textAlign: 'left'
}
const gayaBaris = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  gap: '8px', flexWrap: 'wrap', padding: '10px 0', borderBottom: '1px solid #eee'
}

function MejaBilik() {
  const [bilik, setBilik] = useState(null)
  const [dimuat, setDimuat] = useState(false)
  const [dibuka, setDibuka] = useState(false)
  const [kata, setKata] = useState('')
  const [hasil, setHasil] = useState([])
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(false)

  // Status bilik diperbarui setiap 3 detik
  async function muat() {
    const { data: atur } = await supabase.from('pengaturan').select('voting_dibuka').eq('id', 1).single()
    setDibuka(atur ? atur.voting_dibuka : false)
    const { data, error } = await supabase.rpc('daftar_bilik')
    if (!error) setBilik(data && data.length > 0 ? data[0] : null)
    setDimuat(true)
  }

  useEffect(() => {
    muat()
    const timer = setInterval(muat, 3000)
    return () => clearInterval(timer)
  }, [])

  async function cari(e) {
    e.preventDefault()
    setPesan('')
    const { data, error } = await supabase.rpc('cari_pemilih', { p_kata: kata })
    if (error) setPesan(error.message)
    else {
      setHasil(data)
      if (data.length === 0) setPesan('Pemilih tidak ditemukan.')
    }
  }

  async function masukkan(p) {
    if (!window.confirm(`Masukkan ${p.nama}${p.kelas ? ` (${p.kelas})` : ''} ke ${bilik.nama_bilik}?`)) return
    setLoading(true)
    setPesan('')
    const { error } = await supabase.rpc('aktifkan_bilik', { p_bilik_id: bilik.bilik_id, p_pemilih_id: p.id })
    setLoading(false)
    if (error) {
      setPesan(error.message)
      return
    }
    setHasil([])
    setKata('')
    muat()
  }

  async function batalkan() {
    if (!window.confirm(`Batalkan ${bilik.nama_pemilih} dari ${bilik.nama_bilik}?\nSurat suara yang sudah dipilihnya tetap tercatat.`)) return
    const { error } = await supabase.rpc('kosongkan_bilik', { p_bilik_id: bilik.bilik_id })
    if (error) window.alert(error.message)
    else muat()
  }
    if (!dimuat) return <p>Memuat...</p>

  if (!bilik) {
    return (
      <div style={{ ...gayaKotak, maxWidth: '520px', margin: '0 auto' }}>
        <h3 style={{ marginTop: 0 }}>Belum ditugaskan</h3>
        <p>Akun ini belum ditugaskan ke bilik mana pun. Minta admin guru mengaturnya di menu <b>Bilik → Petugas Bilik</b>.</p>
      </div>
    )
  }

  const dipakai = !!bilik.nama_pemilih
  const siap = dibuka && bilik.terpasang && !dipakai

  let status
  if (!dibuka) status = { warna: '#dc2626', latar: '#fef2f2', teks: '🔴 Voting belum dibuka' }
  else if (!bilik.terpasang) status = { warna: '#6b7280', latar: '#f3f4f6', teks: '⚪ Tablet belum terpasang. Minta admin guru memasang tablet.' }
  else if (dipakai) status = { warna: '#f59e0b', latar: '#fffbeb', teks: `🟡 Sedang dipakai: ${bilik.nama_pemilih}${bilik.kelas ? ` (${bilik.kelas})` : ''}` }
  else status = { warna: '#16a34a', latar: '#f0fdf4', teks: '🟢 Bilik kosong, siap menerima pemilih' }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', fontSize: '2rem', margin: '0 0 12px' }}>{bilik.nama_bilik}</h2>

      <div style={{ ...gayaKotak, border: `2px solid ${status.warna}`, background: status.latar, textAlign: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: 700 }}>{status.teks}</div>
        {dipakai && (
          <button onClick={batalkan} className="tombol-kedua" style={{ marginTop: '12px' }}>
            Batalkan pemilih ini
          </button>
        )}
      </div>

      <section style={gayaKotak}>
        <form onSubmit={cari} style={{ display: 'flex', gap: '8px' }}>
          <input autoFocus value={kata} onChange={(e) => setKata(e.target.value)} required
            placeholder="Ketik nomor absen, NIS, atau nama"
            style={{ flex: 1, padding: '12px', fontSize: '18px', borderRadius: '10px', border: '1px solid #ccc' }} />
          <button type="submit">Cari</button>
        </form>

        {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}

        {hasil.map((p) => (
          <div key={p.id} style={gayaBaris}>
            <span>
              {p.nomor_absen && <>No. {p.nomor_absen} · </>}{p.nis} – <b>{p.nama}</b> {p.kelas && `(${p.kelas})`}
            </span>
            {p.sudah_memilih ? <span>✅ sudah memilih</span>
              : p.di_bilik ? <span>⏳ sedang di bilik</span>
              : (
                <button disabled={!siap || loading} onClick={() => masukkan(p)}>
                  {loading ? 'Memproses...' : `Masukkan ke ${bilik.nama_bilik}`}
                </button>
              )}
          </div>
        ))}

        {hasil.length > 0 && !siap && (
          <p style={{ fontSize: '14px', color: '#666' }}>
            Tombol akan aktif setelah bilik kosong kembali.
          </p>
        )}
      </section>
    </div>
  )
}

export default MejaBilik