import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import KartuKandidat from './KartuKandidat'

function Kandidat({ organisasi, onSelesai, onKembali }) {
  const [daftar, setDaftar] = useState([])
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(false)

  // Ambil kandidat untuk organisasi yang dipilih saja
  useEffect(() => {
    supabase.from('kandidat').select('*')
      .eq('organisasi_id', organisasi.id)
      .order('nomor_urut')
      .then(({ data, error }) => {
        if (error) setPesan(error.message)
        else setDaftar(data)
      })
  }, [organisasi.id])

  async function pilih(k) {
    const yakin = window.confirm(
      `Yakin memilih nomor ${k.nomor_urut} (${k.nama_ketua}) untuk ${organisasi.nama}?\nPilihan tidak bisa diubah.`
    )
    if (!yakin) return

    setLoading(true)
    const { data, error } = await supabase.rpc('pilih', { p_kandidat_id: k.id })
    setLoading(false)

    if (error) setPesan(error.message)
    else onSelesai(data) // 'selesai' atau 'lanjut'
  }

  return (
    <div>
      <button onClick={onKembali} disabled={loading}
        style={{ padding: '10px 16px', marginBottom: '16px' }}>
        ← Kembali ke menu
      </button>

      <h2>Surat Suara {organisasi.nama}</h2>
      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
        {daftar.map((k) => (
          <KartuKandidat key={k.id} k={k}>
            <button onClick={() => pilih(k)} disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '18px', marginTop: '8px' }}>
              {loading ? 'Memproses...' : `Pilih Nomor ${k.nomor_urut}`}
            </button>
          </KartuKandidat>
        ))}
      </div>
    </div>
  )
}

export default Kandidat