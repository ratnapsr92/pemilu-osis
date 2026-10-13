import { useState } from 'react'
import Login from './Login'
import MasukSiswa from './MasukSiswa'
import MasukBilik from './MasukBilik'

const pilihan = [
  { id: 'siswa', label: '🎓 Siswa' },
  { id: 'admin', label: '🛡️ Admin / Panitia' },
  { id: 'bilik', label: '🗳️ Tablet Bilik' },
]

function HalamanMasuk({ onSiswaBerhasil, onBilikBerhasil }) {
  const [jenis, setJenis] = useState('siswa')

  return (
    <div className="kartu" style={{ maxWidth: '400px', margin: '32px auto 0', padding: '24px' }}>
      <label style={{ display: 'block', textAlign: 'left', fontWeight: 700, marginBottom: '6px' }}>
        Masuk sebagai
      </label>
      <select value={jenis} onChange={(e) => setJenis(e.target.value)}
        style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '10px',
          border: '1.5px solid var(--utama)', background: '#fff', fontFamily: 'inherit' }}>
        {pilihan.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>

      {jenis === 'siswa' && <MasukSiswa onBerhasil={onSiswaBerhasil} />}
      {jenis === 'admin' && <Login />}
      {jenis === 'bilik' && <MasukBilik onBerhasil={onBilikBerhasil} />}
    </div>
  )
}

export default HalamanMasuk