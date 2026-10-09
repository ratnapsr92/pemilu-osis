import { useState } from 'react'
import { supabase } from './supabase'

function MasukBilik({ onBerhasil }) {
  const [kode, setKode] = useState('')
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(false)

  async function masuk(e) {
    e.preventDefault()
    setLoading(true)
    setPesan('')

    // Tablet masuk tanpa akun (anonim), lalu dipasangkan ke bilik lewat kode
    const { data: sesi } = await supabase.auth.getSession()
    if (!sesi.session) {
      const { error: errMasuk } = await supabase.auth.signInAnonymously()
      if (errMasuk) {
        setPesan('Gagal masuk: ' + errMasuk.message)
        setLoading(false)
        return
      }
    }

    const { data, error } = await supabase.rpc('pasang_bilik', { p_kode: kode.trim() })
    setLoading(false)

    if (error) setPesan(error.message)
    else if (!data.ok) setPesan(data.pesan)
    else onBerhasil()
  }

  return (
    <form onSubmit={masuk} style={{ maxWidth: '320px', margin: '24px auto' }}>
      <h2>Tablet Bilik</h2>
      <p style={{ fontSize: '14px', color: '#666' }}>Masukkan kode 6 angka dari panitia.</p>
      <input inputMode="numeric" maxLength={6} required value={kode}
        onChange={(e) => setKode(e.target.value.replace(/\D/g, ''))}
        placeholder="000000"
        style={{
          display: 'block', width: '100%', padding: '14px', fontSize: '28px', letterSpacing: '8px',
          textAlign: 'center', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box', marginBottom: '12px'
        }} />
      <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px' }}>
        {loading ? 'Memproses...' : 'Pasang sebagai Bilik'}
      </button>
      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}
    </form>
  )
}

export default MasukBilik