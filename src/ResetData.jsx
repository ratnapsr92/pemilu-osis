import { useState } from 'react'
import { supabase } from './supabase'

const gayaInput = {
  display: 'block', width: '100%', padding: '10px', fontSize: '16px', marginBottom: '10px',
  borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box'
}

const pilihan = [
  { kunci: 'suara', label: 'Suara dan status "sudah memilih"', ket: 'Termasuk catatan koreksi dan bilik yang sedang aktif.' },
  { kunci: 'pemilih', label: 'Data pemilih', ket: 'Otomatis ikut menghapus suara dan status sudah memilih.' },
  { kunci: 'pemenang', label: 'Pemenang yang sudah ditetapkan', ket: 'Otomatis ikut menghapus program kerja, dan halaman Proker disembunyikan lagi.' },
  { kunci: 'proker', label: 'Program kerja', ket: 'Proker, progres, foto bukti, jempol, serta kritik dan saran. Pemenang tetap ada.' },
]

function ResetData({ onSelesai }) {
  const [centang, setCentang] = useState({ suara: false, pemilih: false, pemenang: false, proker: false })
  const [pin, setPin] = useState('')
  const [pinLama, setPinLama] = useState('')
  const [pinBaru, setPinBaru] = useState('')
  const [loading, setLoading] = useState(false)

  // Data yang saling terkait ikut tercentang
  const efektif = {
    suara: centang.suara || centang.pemilih,
    pemilih: centang.pemilih,
    pemenang: centang.pemenang,
    proker: centang.proker || centang.pemenang,
  }
  const terkunci = { suara: centang.pemilih, proker: centang.pemenang }
  const adaYangDipilih = Object.values(efektif).some(Boolean)

  function ubah(kunci) {
    setCentang({ ...centang, [kunci]: !centang[kunci] })
  }

  async function hapus(e) {
    e.preventDefault()
    const daftar = pilihan.filter((p) => efektif[p.kunci]).map((p) => '• ' + p.label).join('\n')
    if (!window.confirm(`Yakin menghapus data berikut?\n\n${daftar}\n\nData yang dihapus TIDAK BISA dikembalikan.`)) return

    setLoading(true)
    const { data, error } = await supabase.rpc('reset_data_pilihan', {
      p_pin: pin,
      p_suara: efektif.suara, p_pemilih: efektif.pemilih,
      p_pemenang: efektif.pemenang, p_proker: efektif.proker,
    })
    setLoading(false)
    setPin('')

    if (error) window.alert(error.message)
    else if (data !== 'ok') window.alert(data)
    else {
      window.alert('Data berhasil dihapus.')
      setCentang({ suara: false, pemilih: false, pemenang: false, proker: false })
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
        Centang data yang ingin dihapus. Gunakan setelah simulasi atau sebelum memulai pemilu baru. Memerlukan PIN keamanan.
      </p>

      <form onSubmit={hapus}>
        {pilihan.map((p) => (
          <label key={p.kunci} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px',
            marginBottom: '8px', borderRadius: '10px', cursor: terkunci[p.kunci] ? 'default' : 'pointer',
            background: efektif[p.kunci] ? '#fef2f2' : '#f9fafb', border: efektif[p.kunci] ? '1px solid #fca5a5' : '1px solid #eee' }}>
            <input type="checkbox" checked={efektif[p.kunci]} disabled={terkunci[p.kunci]}
              onChange={() => ubah(p.kunci)} style={{ width: '20px', height: '20px', marginTop: '2px', flexShrink: 0 }} />
            <span>
              <b>{p.label}</b>
              {terkunci[p.kunci] && <span style={{ fontSize: '12px', color: '#dc2626' }}> (ikut terhapus)</span>}
              <br />
              <span style={{ fontSize: '13px', color: '#666' }}>{p.ket}</span>
            </span>
          </label>
        ))}

        <label style={{ display: 'block', marginTop: '12px' }}>PIN keamanan</label>
        <input type="password" inputMode="numeric" autoComplete="off" required
          value={pin} onChange={(e) => setPin(e.target.value)} style={gayaInput} />

        <button type="submit" disabled={loading || !adaYangDipilih} style={{ background: '#dc2626' }}>
          {loading ? 'Menghapus...' : 'Hapus Data yang Dicentang'}
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