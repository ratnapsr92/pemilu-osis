import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const gayaKartu = {
  width: '260px', padding: '16px', borderRadius: '12px',
  border: '1px solid #ddd', textAlign: 'left', background: '#fff'
}

const gayaFotoKosong = {
  height: '200px', borderRadius: '8px', background: '#eee',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888'
}

function Kandidat({ onSelesai, dibuka }) {
  const [daftar, setDaftar] = useState([])
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(false)

  // Ambil daftar kandidat dari database
  useEffect(() => {
    supabase.from('kandidat').select('*').order('nomor_urut')
      .then(({ data, error }) => {
        if (error) setPesan(error.message)
        else setDaftar(data)
      })
  }, [])

  // Saat tombol Pilih ditekan
  async function pilih(k) {
    const yakin = window.confirm(
      `Yakin memilih nomor ${k.nomor_urut} (${k.nama_ketua})?\nPilihan tidak bisa diubah.`
    )
    if (!yakin) return

    setLoading(true)
    const { error } = await supabase.rpc('pilih', { p_kandidat_id: k.id })
    setLoading(false)

    if (error) setPesan(error.message)
    else onSelesai()
  }

  return (
    <div>
      <h2>Daftar Kandidat</h2>
      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
        {daftar.map((k) => (
          <div key={k.id} style={gayaKartu}>
            {k.foto_url ? (
              <img src={k.foto_url} alt={k.nama_ketua}
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
            ) : (
              <div style={gayaFotoKosong}>Foto belum ada</div>
            )}

            <h3>{k.nomor_urut}. {k.nama_ketua}</h3>
            {k.nama_wakil && <p>Wakil: {k.nama_wakil}</p>}
            <p><b>Visi:</b> {k.visi}</p>
            <p style={{ whiteSpace: 'pre-line' }}><b>Misi:</b> {k.misi}</p>

            <button onClick={() => pilih(k)} disabled={loading || !dibuka}
              style={{ width: '100%', padding: '12px', fontSize: '16px', marginTop: '8px' }}>
              {!dibuka ? 'Voting belum dibuka' :loading ? 'Memproses...' : `Pilih Nomor ${k.nomor_urut}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Kandidat