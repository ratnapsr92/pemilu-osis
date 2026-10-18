import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import DukunganKomentar from './DukunganKomentar'
import { jabatan } from './jabatan'

// Ubah link YouTube biasa menjadi link yang bisa ditampilkan
function linkEmbed(url) {
  if (!url) return null
  const cocok = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)
  return cocok ? `https://www.youtube.com/embed/${cocok[1]}` : null
}

   function ProfilPaslon({ k, org, siswa, onMasuk, onKembali }) {
  const [media, setMedia] = useState([])
  const j = jabatan(org.nama)

  useEffect(() => {
    supabase.from('kampanye_media').select('*')
      .eq('kandidat_id', k.id)
      .order('urutan').order('dibuat_pada')
      .then(({ data }) => {
        if (data) setMedia(data)
      })
  }, [k.id])

  const foto = media.filter((m) => m.jenis === 'foto')
  const video = [
    ...(k.video_url ? [{ id: 'utama', url: k.video_url, keterangan: 'Video kampanye' }] : []),
    ...media.filter((m) => m.jenis === 'video'),
  ]

  return (
    <div style={{ paddingTop: '20px', textAlign: 'left' }}>
      <button className="tombol-kedua" onClick={onKembali}>← Kembali ke daftar paslon</button>

      {/* Foto & identitas */}
      <section className="kartu profil-kepala">
        <div className="profil-foto">
          {k.foto_url ? (
            <img src={k.foto_url} alt={k.nama_ketua} />
          ) : (
            <div className="foto-kosong">Foto belum ada</div>
          )}
          <span className="nomor-urut">{k.nomor_urut}</span>
        </div>
        <div className="profil-isi">
          <div className="kecil">CALON {org.nama.toUpperCase()} · NOMOR URUT {k.nomor_urut}</div>
          <h2>{k.nama_ketua}</h2>
          <p className="redup">Calon {j.ketua}{k.kelas_ketua && ` · Kelas ${k.kelas_ketua}`}</p>
          {k.nama_wakil && (
            <p className="redup" style={{ marginTop: '10px' }}>
              <b style={{ color: 'var(--teks)' }}>{k.nama_wakil}</b>
              <br />
              Calon {j.wakil}{k.kelas_wakil && ` · Kelas ${k.kelas_wakil}`}
            </p>
          )}
        </div>
      </section>

      {/* Visi & misi (bisa dibuka-tutup) */}
      {k.visi && (
        <details className="kartu lipat">
          <summary>Visi</summary>
          <p>{k.visi}</p>
        </details>
      )}
      {k.misi && (
        <details className="kartu lipat">
          <summary>Misi</summary>
          <p>{k.misi}</p>
        </details>
      )}

            {k.program_kerja && (
        <details className="kartu lipat">
          <summary>Program Kerja</summary>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            {k.program_kerja.split('\n')
              .map((b) => b.replace(/^\s*(\d+[.)]|[-•*])\s*/, '').trim())
              .filter(Boolean)
              .map((b, i) => <li key={i} style={{ marginBottom: '6px' }}>{b}</li>)}
          </ol>
        </details>
      )}
      {/* Galeri foto kegiatan */}
      {foto.length > 0 && (
        <section>
          <h3 className="judul-bagian">Dokumentasi Kegiatan</h3>
                    <div className="galeri">
            {foto.map((m) => (
              <figure key={m.id}>
                <a href={m.url} target="_blank" rel="noreferrer">
                  <img src={m.url} alt={m.keterangan || 'Foto kegiatan kampanye'} loading="lazy"
                    style={{ objectFit: 'contain', background: '#f3f4f6', cursor: 'zoom-in' }} />
                </a>
                {m.keterangan && <figcaption>{m.keterangan}</figcaption>}
              </figure>
            ))}
          </div>
                    {foto.length > 1 && <p className="petunjuk">← geser untuk melihat foto lainnya →</p>}
        </section>
      )}

      {/* Video kampanye */}
      {video.length > 0 && (
        <section>
          <h3 className="judul-bagian">Video Kampanye</h3>
          {video.map((v) => {
            const tautan = linkEmbed(v.url)
            if (!tautan) return null
            return (
              <div key={v.id} style={{ marginBottom: '16px' }}>
                <div className="video">
                  <iframe src={tautan} title={v.keterangan || 'Video kampanye'} allowFullScreen />
                </div>
                {v.keterangan && <p className="redup" style={{ fontSize: '13px' }}>{v.keterangan}</p>}
              </div>
            )
          })}
        </section>
      )}
             <DukunganKomentar k={k} siswa={siswa} onMasuk={onMasuk} />
    </div>
  )
}

export default ProfilPaslon