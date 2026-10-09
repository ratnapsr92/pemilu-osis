import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import KelolaMedia from './KelolaMedia'

const gayaKotak = {
  border: '1px solid #ddd', borderRadius: '12px', padding: '16px', marginBottom: '16px', background: '#fff'
}
const gayaInput = {
  display: 'block', width: '100%', padding: '10px', fontSize: '16px', marginBottom: '10px',
  borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit'
}
const kosong = {
  nomor_urut: '', nama_ketua: '', kelas_ketua: '', nama_wakil: '', kelas_wakil: '',
  visi: '', misi: '', video_url: '', foto_url: ''
}

// Kecilkan foto (maks 1000 px) supaya ringan
async function kecilkanFoto(file, maks = 1000) {
  const gambar = await createImageBitmap(file)
  const skala = Math.min(1, maks / Math.max(gambar.width, gambar.height))
  const kanvas = document.createElement('canvas')
  kanvas.width = Math.round(gambar.width * skala)
  kanvas.height = Math.round(gambar.height * skala)
  kanvas.getContext('2d').drawImage(gambar, 0, 0, kanvas.width, kanvas.height)
  return new Promise((selesai) => kanvas.toBlob(selesai, 'image/jpeg', 0.85))
}
// Form tambah / ubah kandidat
function FormKandidat({ awal, organisasiId, onSelesai, onBatal }) {
  const [isi, setIsi] = useState(awal)
  const [foto, setFoto] = useState(null)
  const [pratinjau, setPratinjau] = useState(awal.foto_url || '')
  const [loading, setLoading] = useState(false)
  const [pesan, setPesan] = useState('')
  const baru = !awal.id

  function ubah(kolom) {
    return (e) => setIsi({ ...isi, [kolom]: e.target.value })
  }

  function pilihFoto(e) {
    const berkas = e.target.files[0]
    if (!berkas) return
    setFoto(berkas)
    setPratinjau(URL.createObjectURL(berkas))
  }

  async function simpan(e) {
    e.preventDefault()
    setLoading(true)
    setPesan('')

    let fotoUrl = isi.foto_url || null
    if (foto) {
      const berkas = await kecilkanFoto(foto)
      const lokasi = `${organisasiId}/${Date.now()}.jpg`
      const { error: errUpload } = await supabase.storage
        .from('foto-kandidat').upload(lokasi, berkas, { contentType: 'image/jpeg' })
      if (errUpload) {
        setPesan('Gagal upload foto: ' + errUpload.message)
        setLoading(false)
        return
      }
      fotoUrl = supabase.storage.from('foto-kandidat').getPublicUrl(lokasi).data.publicUrl
    }

    const bersih = (t) => (t ?? '').toString().trim() || null
    const data = {
      organisasi_id: organisasiId,
      nomor_urut: Number(isi.nomor_urut),
      nama_ketua: isi.nama_ketua.trim(),
      kelas_ketua: bersih(isi.kelas_ketua),
      nama_wakil: bersih(isi.nama_wakil),
      kelas_wakil: bersih(isi.kelas_wakil),
      visi: bersih(isi.visi),
      misi: bersih(isi.misi),
      video_url: bersih(isi.video_url),
      foto_url: fotoUrl,
    }
    const { error } = baru
      ? await supabase.from('kandidat').insert(data)
      : await supabase.from('kandidat').update(data).eq('id', awal.id)
    setLoading(false)

    if (error) {
      if (error.code === '23505') setPesan('Nomor urut sudah dipakai kandidat lain di organisasi ini.')
      else setPesan(error.message)
      return
    }
    onSelesai()
  }

  return (
    <form onSubmit={simpan} style={{ ...gayaKotak, border: '2px solid #4f46e5' }}>
      <h3 style={{ marginTop: 0 }}>{baru ? 'Tambah Kandidat' : 'Ubah Kandidat'}</h3>

      <label>Foto kandidat</label>
      {pratinjau && (
        <img src={pratinjau} alt="Pratinjau"
          style={{ display: 'block', width: '160px', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
      )}
      <input type="file" accept="image/*" onChange={pilihFoto} style={{ display: 'block', marginBottom: '12px' }} />

      <label>Nomor urut</label>
      <input type="number" min="1" required value={isi.nomor_urut} onChange={ubah('nomor_urut')} style={gayaInput} />
      <label>Nama ketua</label>
      <input required value={isi.nama_ketua} onChange={ubah('nama_ketua')} style={gayaInput} />
      <label>Kelas ketua</label>
      <input value={isi.kelas_ketua || ''} onChange={ubah('kelas_ketua')} placeholder="Contoh: 8A" style={gayaInput} />
      <label>Nama wakil (kosongkan jika perorangan)</label>
      <input value={isi.nama_wakil || ''} onChange={ubah('nama_wakil')} style={gayaInput} />
      <label>Kelas wakil</label>
      <input value={isi.kelas_wakil || ''} onChange={ubah('kelas_wakil')} placeholder="Contoh: 7B" style={gayaInput} />
      <label>Visi</label>
      <textarea rows={3} value={isi.visi || ''} onChange={ubah('visi')} style={gayaInput} />
      <label>Misi (satu poin per baris)</label>
      <textarea rows={5} value={isi.misi || ''} onChange={ubah('misi')} style={gayaInput} />
      <label>Video kampanye utama (link YouTube, opsional)</label>
      <input value={isi.video_url || ''} onChange={ubah('video_url')} placeholder="https://youtu.be/..." style={gayaInput} />

      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
        <button type="button" className="tombol-kedua" onClick={onBatal} disabled={loading}>Batal</button>
      </div>
    </form>
  )
}
// Halaman kelola kandidat
function KelolaKandidat() {
  const [organisasi, setOrganisasi] = useState([])
  const [orgAktif, setOrgAktif] = useState(null)
  const [kandidat, setKandidat] = useState([])
  const [dibuka, setDibuka] = useState(false)
  const [form, setForm] = useState(null)
  const [mediaUntuk, setMediaUntuk] = useState(null)

  async function muat() {
    const { data: atur } = await supabase.from('pengaturan').select('voting_dibuka').eq('id', 1).single()
    setDibuka(atur ? atur.voting_dibuka : false)
    const { data } = await supabase.from('kandidat').select('*').order('nomor_urut')
    if (data) setKandidat(data)
  }

  useEffect(() => {
    supabase.from('organisasi').select('*').order('urutan')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setOrganisasi(data)
          setOrgAktif(data[0].id)
        }
      })
    muat()
  }, [])

  async function hapus(k) {
    if (!window.confirm(`Hapus kandidat nomor ${k.nomor_urut} (${k.nama_ketua})?`)) return
    const { error } = await supabase.from('kandidat').delete().eq('id', k.id)
    if (error) {
      if (error.code === '23503') {
        window.alert('Kandidat ini tidak bisa dihapus karena sudah memiliki suara atau sudah ditetapkan sebagai pemenang. Hapus hasil voting terlebih dahulu.')
      } else {
        window.alert(error.message)
      }
      return
    }
    muat()
  }

  const daftar = kandidat.filter((k) => k.organisasi_id === orgAktif)
  const nomorBerikut = daftar.length > 0 ? Math.max(...daftar.map((k) => k.nomor_urut)) + 1 : 1

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'left' }}>
      <h2 style={{ textAlign: 'center' }}>Kelola Kandidat</h2>

      <div style={{ textAlign: 'center' }}>
        <div className="tab-pil">
          {organisasi.map((o) => (
            <button key={o.id} className={orgAktif === o.id ? 'aktif' : ''}
              onClick={() => { setOrgAktif(o.id); setForm(null); setMediaUntuk(null) }}>
              {o.nama}
            </button>
          ))}
        </div>
      </div>

      {dibuka && (
        <p style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px' }}>
          🔒 Voting sedang dibuka. Data kandidat tidak bisa diubah sampai voting ditutup.
        </p>
      )}

      {!dibuka && !form && (
        <button onClick={() => setForm('baru')} style={{ marginBottom: '16px' }}>+ Tambah Kandidat</button>
      )}

      {form && (
        <FormKandidat
          key={form === 'baru' ? 'baru' : form.id}
          awal={form === 'baru' ? { ...kosong, nomor_urut: nomorBerikut } : form}
          organisasiId={orgAktif}
          onSelesai={() => { setForm(null); muat() }}
          onBatal={() => setForm(null)}
        />
      )}

      {daftar.map((k) => (
        <div key={k.id} style={gayaKotak}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {k.foto_url ? (
              <img src={k.foto_url} alt={k.nama_ketua}
                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '64px', height: '64px', borderRadius: '10px', background: '#eee', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: '150px' }}>
              <b>{k.nomor_urut}. {k.nama_ketua}</b>{k.kelas_ketua && ` (${k.kelas_ketua})`}
              {k.nama_wakil && (
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Wakil: {k.nama_wakil}{k.kelas_wakil && ` (${k.kelas_wakil})`}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button className="tombol-kedua" onClick={() => setMediaUntuk(mediaUntuk === k.id ? null : k.id)}>
                📷 Media
              </button>
              {!dibuka && <button className="tombol-kedua" onClick={() => setForm(k)}>Ubah</button>}
              {!dibuka && <button onClick={() => hapus(k)} style={{ background: '#dc2626' }}>Hapus</button>}
            </div>
          </div>

          {mediaUntuk === k.id && <KelolaMedia kandidat={k} />}
        </div>
      ))}

      {daftar.length === 0 && <p>Belum ada kandidat untuk organisasi ini.</p>}
    </div>
  )
}

export default KelolaKandidat
