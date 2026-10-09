import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import ProfilPaslon from './ProfilPaslon'

// Acak urutan paslon supaya adil (tidak ada yang selalu tampil pertama)
function acak(daftar) {
  const hasil = [...daftar]
  for (let i = hasil.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[hasil[i], hasil[j]] = [hasil[j], hasil[i]]
  }
  return hasil
}

function DetailOrganisasi({ org, onKembali }) {
  const [paslon, setPaslon] = useState([])
  const [dimuat, setDimuat] = useState(false)
  const [dipilih, setDipilih] = useState(null)

  useEffect(() => {
    supabase.from('kandidat').select('*').eq('organisasi_id', org.id)
      .then(({ data }) => {
        if (data) setPaslon(acak(data))
        setDimuat(true)
      })
  }, [org.id])

  function bukaProfil(k) {
    setDipilih(k)
    window.scrollTo(0, 0)
  }

  if (dipilih) {
    return (
      <ProfilPaslon k={dipilih} org={org}
        onKembali={() => { setDipilih(null); window.scrollTo(0, 0) }} />
    )
  }

  return (
    <div style={{ paddingTop: '20px' }}>
      <div style={{ textAlign: 'left' }}>
        <button className="tombol-kedua" onClick={onKembali}>← Kembali</button>
      </div>

      <div className="kepala-org">
        {org.logo && <img src={org.logo} alt={`Logo ${org.nama}`} />}
        <div>
          <div className="kecil">PEMILU</div>
          <h2>{org.nama.toUpperCase()}</h2>
        </div>
      </div>
      <p className="catatan-acak">Urutan tampilan paslon diacak setiap kali halaman dibuka.</p>

      <div className="grid-kandidat">
        {paslon.map((k) => (
          <article key={k.id} className="kartu kartu-kandidat">
            <div className="foto">
              {k.foto_url ? (
                <img src={k.foto_url} alt={k.nama_ketua} />
              ) : (
                <div className="foto-kosong">Foto belum ada</div>
              )}
              <span className="nomor-urut">{k.nomor_urut}</span>
            </div>
            <div className="isi">
              <h3>{k.nama_ketua}</h3>
              {k.kelas_ketua && <p className="wakil">Calon Ketua · Kelas {k.kelas_ketua}</p>}
              {k.nama_wakil && (
                <p className="wakil">
                  Wakil: {k.nama_wakil}{k.kelas_wakil && ` · Kelas ${k.kelas_wakil}`}
                </p>
              )}
              <button onClick={() => bukaProfil(k)} style={{ width: '100%', marginTop: '8px' }}>
                Lihat Profil
              </button>
            </div>
          </article>
        ))}
      </div>

      {dimuat && paslon.length === 0 && <p>Belum ada kandidat.</p>}
    </div>
  )
}

export default DetailOrganisasi