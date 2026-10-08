import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import KartuKandidat from './KartuKandidat'

function Kampanye() {
  const [organisasi, setOrganisasi] = useState([])
  const [aktif, setAktif] = useState(null)
  const [kandidat, setKandidat] = useState([])

  useEffect(() => {
    supabase.from('organisasi').select('*').order('urutan')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setOrganisasi(data)
          setAktif(data[0].id)
        }
      })

    supabase.from('kandidat').select('*').order('nomor_urut')
      .then(({ data }) => {
        if (data) setKandidat(data)
      })
  }, [])

  const tampil = kandidat.filter((k) => k.organisasi_id === aktif)

  return (
    <div>
      <h2>Kenali Kandidatmu</h2>

      {/* Tab organisasi */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
        {organisasi.map((o) => (
          <button key={o.id} onClick={() => setAktif(o.id)}
            style={{
              padding: '10px 24px', fontSize: '16px', borderRadius: '999px',
              border: '2px solid #4f46e5',
              background: aktif === o.id ? '#4f46e5' : '#fff',
              color: aktif === o.id ? '#fff' : '#4f46e5',
            }}>
            {o.nama}
          </button>
        ))}
      </div>

      {/* Daftar kandidat */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
        {tampil.map((k) => (
          <KartuKandidat key={k.id} k={k} tampilVideo />
        ))}
      </div>

      {tampil.length === 0 && <p>Belum ada kandidat.</p>}
    </div>
  )
}

export default Kampanye