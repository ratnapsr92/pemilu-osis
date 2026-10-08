// Ubah link YouTube biasa menjadi link yang bisa ditampilkan di aplikasi
function linkEmbed(url) {
  if (!url) return null
  const cocok = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)
  return cocok ? `https://www.youtube.com/embed/${cocok[1]}` : null
}

const gayaKartu = {
  width: '100%', maxWidth: '320px', padding: '16px', borderRadius: '12px',
  border: '1px solid #ddd', textAlign: 'left', background: '#fff', boxSizing: 'border-box'
}

const gayaFotoKosong = {
  height: '200px', borderRadius: '8px', background: '#eee',
  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888'
}

function KartuKandidat({ k, tampilVideo = false, children }) {
  const video = tampilVideo ? linkEmbed(k.video_url) : null

  return (
    <div style={gayaKartu}>
      {k.foto_url ? (
        <img src={k.foto_url} alt={k.nama_ketua}
          style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '8px' }} />
      ) : (
        <div style={gayaFotoKosong}>Foto belum ada</div>
      )}

      <h3>{k.nomor_urut}. {k.nama_ketua}</h3>
      {k.nama_wakil && <p>Wakil: {k.nama_wakil}</p>}
      <p><b>Visi:</b> {k.visi}</p>
      <p style={{ whiteSpace: 'pre-line' }}><b>Misi:</b> {k.misi}</p>

      {video && (
        <div style={{ position: 'relative', paddingTop: '56.25%', marginTop: '8px' }}>
          <iframe src={video} title={`Video kampanye ${k.nama_ketua}`} allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, borderRadius: '8px' }} />
        </div>
      )}

      {children}
    </div>
  )
}

export default KartuKandidat