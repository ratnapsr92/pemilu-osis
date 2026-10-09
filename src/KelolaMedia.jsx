import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const gayaInput = {
  display: 'block', width: '100%', padding: '10px', fontSize: '16px', marginBottom: '10px',
  borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit'
}

// Kecilkan foto (maks 1280 px) supaya ringan
async function kecilkanFoto(file, maks = 1280) {
  const gambar = await createImageBitmap(file)
  const skala = Math.min(1, maks / Math.max(gambar.width, gambar.height))
  const kanvas = document.createElement('canvas')
  kanvas.width = Math.round(gambar.width * skala)
  kanvas.height = Math.round(gambar.height * skala)
  kanvas.getContext('2d').drawImage(gambar, 0, 0, kanvas.width, kanvas.height)
  return new Promise((selesai) => kanvas.toBlob(selesai, 'image/jpeg', 0.82))
}

function KelolaMedia({ kandidat }) {
  const [media, setMedia] = useState([])
  const [jenis, setJenis] = useState('foto')
  const [berkas, setBerkas] = useState([])
  const [url, setUrl] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [loading, setLoading] = useState(false)
  const [pesan, setPesan] = useState('')

  async function muat() {
    const { data } = await supabase.from('kampanye_media').select('*')
      .eq('kandidat_id', kandidat.id).order('dibuat_pada')
    if (data) setMedia(data)
  }

  useEffect(() => {
    muat()
  }, [kandidat.id])

  async function tambah(e) {
    e.preventDefault()
    const formulir = e.target
    setLoading(true)
    setPesan('')

    if (jenis === 'foto') {
      for (const file of berkas) {
        const gambar = await kecilkanFoto(file)
        const lokasi = `${kandidat.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`
        const { error: errUpload } = await supabase.storage
          .from('kampanye').upload(lokasi, gambar, { contentType: 'image/jpeg' })
        if (errUpload) {
          setPesan('Gagal upload foto: ' + errUpload.message)
          setLoading(false)
          return
        }
        const alamat = supabase.storage.from('kampanye').getPublicUrl(lokasi).data.publicUrl
        const { error } = await supabase.from('kampanye_media').insert({
          kandidat_id: kandidat.id, jenis: 'foto', url: alamat, keterangan: keterangan || null,
        })
        if (error) {
          setPesan(error.message)
          setLoading(false)
          return
        }
      }
    } else {
      const { error } = await supabase.from('kampanye_media').insert({
        kandidat_id: kandidat.id, jenis: 'video', url: url.trim(), keterangan: keterangan || null,
      })
      if (error) {
        setPesan(error.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    setBerkas([])
    setUrl('')
    setKeterangan('')
    formulir.reset()
    muat()
  }

  async function hapus(m) {
    if (!window.confirm('Hapus media ini?')) return
    const { error } = await supabase.from('kampanye_media').delete().eq('id', m.id)
    if (error) window.alert(error.message)
    else muat()
  }

  return (
    <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '10px' }}>
      <b>Dokumentasi kampanye: {kandidat.nama_ketua}</b>

      {/* Daftar media */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '10px 0' }}>
        {media.map((m) => (
          <div key={m.id} style={{ width: '110px', fontSize: '12px' }}>
            {m.jenis === 'foto' ? (
              <img src={m.url} alt="" style={{ width: '110px', height: '82px', objectFit: 'cover', borderRadius: '8px' }} />
            ) : (
              <div style={{ width: '110px', height: '82px', borderRadius: '8px', background: '#1f2937', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶ Video</div>
            )}
            <button onClick={() => hapus(m)}
              style={{ width: '100%', marginTop: '4px', padding: '4px', fontSize: '12px', background: '#dc2626' }}>
              Hapus
            </button>
          </div>
        ))}
        {media.length === 0 && <span style={{ color: '#666' }}>Belum ada media.</span>}
      </div>

      {/* Form tambah media */}
      <form onSubmit={tambah}>
        <select value={jenis} onChange={(e) => setJenis(e.target.value)} style={gayaInput}>
          <option value="foto">Foto kegiatan</option>
          <option value="video">Video YouTube</option>
        </select>

        {jenis === 'foto' ? (
          <input type="file" accept="image/*" multiple required
            onChange={(e) => setBerkas(Array.from(e.target.files))}
            style={{ display: 'block', marginBottom: '10px' }} />
        ) : (
          <input required value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtu.be/..." style={gayaInput} />
        )}

        <input value={keterangan} onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Keterangan (opsional), contoh: Orasi di lapangan, 12 Oktober" style={gayaInput} />

        <button type="submit" disabled={loading}>
          {loading ? 'Mengunggah...' : jenis === 'foto' ? '+ Tambah Foto' : '+ Tambah Video'}
        </button>
        {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}
      </form>
    </div>
  )
}

export default KelolaMedia