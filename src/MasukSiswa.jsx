import { useState } from 'react'
import { supabase } from './supabase'

const gayaInput = {
  display: 'block', width: '100%', padding: '12px', fontSize: '16px', marginBottom: '12px',
  borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box'
}

function MasukSiswa({ onBerhasil }) {
  const [nis, setNis] = useState('')
  const [kode, setKode] = useState('')
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(false)

  async function masuk(e) {
    e.preventDefault()
    setLoading(true)
    setPesan('')
    const { data: sesi } = await supabase.auth.getSession()
    if (!sesi.session) {
      const { error: errMasuk } = await supabase.auth.signInAnonymously()
      if (errMasuk) {
        setPesan('Gagal masuk: ' + errMasuk.message)
        setLoading(false)
        return
      }
    }
    const { data, error } = await supabase.rpc('masuk_siswa', { p_nis: nis.trim(), p_kode: kode.trim() })
    setLoading(false)
    if (error) setPesan(error.message)
    else if (!data.ok) setPesan(data.pesan)
    else onBerhasil()
  }

  return (
    <form onSubmit={masuk} style={{ maxWidth: '320px', margin: '24px auto' }}>
      <h2>Siswa</h2>
      <p style={{ fontSize: '14px', color: '#666' }}>Masuk untuk memberi dukungan dan komentar pada paslon.</p>
      <input required value={nis} onChange={(e) => setNis(e.target.value)} placeholder="NIS" style={gayaInput} />
      <input required value={kode} onChange={(e) => setKode(e.target.value)} placeholder="Kode pribadi (6 karakter)"
        autoComplete="off" style={{ ...gayaInput, letterSpacing: '3px' }} />
      <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px' }}>
        {loading ? 'Memproses...' : 'Masuk sebagai Siswa'}
      </button>
      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}
    </form>
  )
}

export default MasukSiswa