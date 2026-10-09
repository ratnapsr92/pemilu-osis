import { useState } from 'react'
import { supabase } from './supabase'

const gayaInput = {
  display: 'block', width: '100%', padding: '10px', fontSize: '16px', marginBottom: '10px',
  borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box'
}

const pilihan = [
  { nilai: 'suara', label: 'Hasil voting saja (suara, status sudah memilih, bilik)' },
  { nilai: 'pemilih', label: 'Hasil voting + data pemilih' },
  { nilai: 'semua', label: 'Semua: hasil voting, pemilih, pemenang & proker' },
]

function ResetData({ onSelesai }) {
  const [jenis, setJenis] = useState('suara')
  const [pin, setPin] = useState('')
  const [pinLama, setPinLama] = useState('')
  const [pinBaru, setPinBaru] = useState('')
  const [loading, setLoading] = useState(false)

  async function hapus(e) {
    e.preventDefault()
    const label = pilihan.find((p) => p.nilai === jenis).label
    if (!window.confirm(`Yakin menghapus: ${label}?\n\nData yang dihapus TIDAK BISA dikembalikan.`)) return

    setLoading(true)
    const { data, error } = await supabase.rpc('reset_data', { p_pin: pin, p_jenis: jenis })
    setLoading(false)
    setPin('')

    if (error) window.alert(error.message)
    else if (data !== 'ok') window.alert(data)
    else {
      window.alert('Data berhasil dihapus.')
      onSelesai()
    }
  }

  async function gantiPin(e) {
    e.preventDefault()
    const { data, error } = await supabase.rpc('ganti_pin', { p_lama: pinLama, p_baru: pinBaru })
    setPinLama('')
    setPinBaru('')

    if (error) window.alert(error.message)
    else if (data !== 'ok') window.alert(data)
    else window.alert('PIN berhasil diganti.')
  }

  return (
    <section style={{ border: '2px solid #dc2626', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
      <h3 style={{ color: '#dc2626' }}>⚠️ Hapus Data (khusus guru / kesiswaan)</h3>
      <p style={{ fontSize: '14px', color: '#666' }}>
        Gunakan setelah simulasi atau sebelum memulai pemilu baru. Memerlukan PIN keamanan.
      </p>

      <form onSubmit={hapus}>
        <label>Data yang dihapus</label>
        <select value={jenis} onChange={(e) => setJenis(e.target.value)} style={gayaInput}>
          {pilihan.map((p) => <option key={p.nilai} value={p.nilai}>{p.label}</option>)}
        </select>

        <label>PIN keamanan</label>
        <input type="password" inputMode="numeric" autoComplete="off" required
          value={pin} onChange={(e) => setPin(e.target.value)} style={gayaInput} />

        <button type="submit" disabled={loading} style={{ background: '#dc2626' }}>
          {loading ? 'Menghapus...' : 'Hapus Data'}
        </button>
      </form>

      <details style={{ marginTop: '20px' }}>
        <summary style={{ cursor: 'pointer' }}>Ganti PIN</summary>
        <form onSubmit={gantiPin} style={{ marginTop: '10px' }}>
          <label>PIN lama</label>
          <input type="password" autoComplete="off" required
            value={pinLama} onChange={(e) => setPinLama(e.target.value)} style={gayaInput} />
          <label>PIN baru (minimal 6 karakter)</label>
          <input type="password" autoComplete="off" required minLength={6}
            value={pinBaru} onChange={(e) => setPinBaru(e.target.value)} style={gayaInput} />
          <button type="submit" className="tombol-kedua">Simpan PIN Baru</button>
        </form>
      </details>
    </section>
  )
}

export default ResetData