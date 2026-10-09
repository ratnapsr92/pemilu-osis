import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const gayaKotak = {
  border: '1px solid #ddd', borderRadius: '12px', padding: '16px', marginBottom: '16px'
}
const gayaBaris = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  gap: '8px', padding: '8px 0', borderBottom: '1px solid #eee'
}

function MejaPanitia() {
  const [daftarBilik, setDaftarBilik] = useState([])
  const [kata, setKata] = useState('')
  const [hasilCari, setHasilCari] = useState([])
  const [dipilih, setDipilih] = useState(null)
  const [pesan, setPesan] = useState('')

  async function muatBilik() {
    const { data, error } = await supabase.rpc('daftar_bilik')
    if (error) setPesan(error.message)
    else setDaftarBilik(data)
  }

  // Status bilik diperbarui setiap 3 detik
  useEffect(() => {
    muatBilik()
    const timer = setInterval(muatBilik, 3000)
    return () => clearInterval(timer)
  }, [])

  async function cari(e) {
    e.preventDefault()
    setPesan('')
    setDipilih(null)
    const { data, error } = await supabase.rpc('cari_pemilih', { p_kata: kata })
    if (error) setPesan(error.message)
    else {
      setHasilCari(data)
      if (data.length === 0) setPesan('Pemilih tidak ditemukan.')
    }
  }

  async function aktifkan(bilikId) {
    setPesan('')
    const { error } = await supabase.rpc('aktifkan_bilik', {
      p_bilik_id: bilikId,
      p_pemilih_id: dipilih.id,
    })
    if (error) setPesan(error.message)
    else {
      setDipilih(null)
      setHasilCari([])
      setKata('')
      muatBilik()
    }
  }

  async function kosongkan(bilikId) {
    if (!window.confirm('Batalkan pemilih di bilik ini?')) return
    const { error } = await supabase.rpc('kosongkan_bilik', { p_bilik_id: bilikId })
    if (error) setPesan(error.message)
    else muatBilik()
  }

  return (
    <section style={gayaKotak}>
      <h3>Meja Panitia</h3>

      <form onSubmit={cari} style={{ display: 'flex', gap: '8px' }}>
        <input value={kata} onChange={(e) => setKata(e.target.value)}
          placeholder="Ketik NIS atau nama" required
          style={{ flex: 1, padding: '10px', fontSize: '16px' }} />
        <button type="submit" style={{ padding: '10px 16px' }}>Cari</button>
      </form>

      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}

      {hasilCari.map((p) => (
        <div key={p.id} style={gayaBaris}>
          <span>{p.nis} – <b>{p.nama}</b> {p.kelas && `(${p.kelas})`}</span>
          {p.sudah_memilih ? <span>✅ sudah memilih</span>
            : p.di_bilik ? <span>⏳ sedang di bilik</span>
            : <button onClick={() => setDipilih(p)}>Pilih</button>}
        </div>
      ))}

      {dipilih && (
        <p style={{ background: '#eef2ff', padding: '8px', borderRadius: '8px' }}>
          Arahkan <b>{dipilih.nama}</b> ke bilik yang kosong, lalu klik <b>Aktifkan</b>:
        </p>
      )}

      <h4>Status Bilik</h4>
      {daftarBilik.map((b) => (
        <div key={b.bilik_id} style={gayaBaris}>
          <span>
            <b>{b.nama_bilik}</b>: {b.nama_pemilih
              ? `🟡 ${b.nama_pemilih} ${b.kelas ? `(${b.kelas})` : ''}`
              : '⚪ kosong'}
          </span>
          {b.nama_pemilih
            ? <button onClick={() => kosongkan(b.bilik_id)}>Batalkan</button>
            : <button disabled={!dipilih} onClick={() => aktifkan(b.bilik_id)}>Aktifkan</button>}
        </div>
      ))}
    </section>
  )
}

export default MejaPanitia
import BeritaAcara from './BeritaAcara'