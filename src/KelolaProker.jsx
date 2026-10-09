import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const gayaKotak = {
  border: '1px solid #ddd', borderRadius: '12px', padding: '16px', marginBottom: '16px', background: '#fff'
}
const gayaInput = {
  display: 'block', width: '100%', padding: '10px', fontSize: '16px', marginBottom: '10px',
  borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box'
}
const daftarStatus = ['belum mulai', 'berjalan', 'selesai', 'batal']

// Kecilkan foto (maks 1280 px) supaya upload cepat & hemat penyimpanan
async function kecilkanFoto(file, maks = 1280) {
  const gambar = await createImageBitmap(file)
  const skala = Math.min(1, maks / Math.max(gambar.width, gambar.height))
  const kanvas = document.createElement('canvas')
  kanvas.width = Math.round(gambar.width * skala)
  kanvas.height = Math.round(gambar.height * skala)
  kanvas.getContext('2d').drawImage(gambar, 0, 0, kanvas.width, kanvas.height)
  return new Promise((selesai) => kanvas.toBlob(selesai, 'image/jpeg', 0.8))
}

// Form untuk memperbarui satu proker
function FormPerbarui({ proker, onSelesai }) {
  const [status, setStatus] = useState(proker.status)
  const [progres, setProgres] = useState(proker.progres)
  const [catatan, setCatatan] = useState('')
  const [foto, setFoto] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pesan, setPesan] = useState('')

  async function simpan(e) {
    e.preventDefault()
    setLoading(true)
    setPesan('')

    // 1. Upload foto (jika ada)
    let fotoUrl = null
    if (foto) {
      const berkas = await kecilkanFoto(foto)
      const lokasi = `${proker.kepengurusan_id}/${proker.id}/${Date.now()}.jpg`
      const { error: errUpload } = await supabase.storage
        .from('bukti-proker').upload(lokasi, berkas, { contentType: 'image/jpeg' })
      if (errUpload) {
        setPesan('Gagal upload foto: ' + errUpload.message)
        setLoading(false)
        return
      }
      fotoUrl = supabase.storage.from('bukti-proker').getPublicUrl(lokasi).data.publicUrl
    }

    // 2. Perbarui status & progres proker
    const { error: errProker } = await supabase.from('proker')
      .update({ status: status, progres: Number(progres) })
      .eq('id', proker.id)
    if (errProker) {
      setPesan(errProker.message)
      setLoading(false)
      return
    }

    // 3. Catat riwayat pembaruan
    const { error: errRiwayat } = await supabase.from('proker_update').insert({
      proker_id: proker.id,
      catatan: catatan,
      progres: Number(progres),
      foto_url: fotoUrl,
    })
    setLoading(false)

    if (errRiwayat) setPesan(errRiwayat.message)
    else onSelesai()
  }

  return (
    <form onSubmit={simpan} style={{ marginTop: '12px', background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
      <label>Status</label>
      <select value={status} onChange={(e) => setStatus(e.target.value)} style={gayaInput}>
        {daftarStatus.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <label>Progres: <b>{progres}%</b></label>
      <input type="range" min="0" max="100" step="5" value={progres}
        onChange={(e) => setProgres(e.target.value)}
        style={{ width: '100%', marginBottom: '10px' }} />

      <label>Catatan kegiatan</label>
      <textarea required rows={3} value={catatan} onChange={(e) => setCatatan(e.target.value)}
        placeholder="Contoh: Penilaian bulan pertama sudah dilakukan di semua kelas."
        style={gayaInput} />

      <label>Foto bukti kegiatan (opsional)</label>
      <input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files[0] || null)}
        style={{ display: 'block', marginBottom: '12px' }} />

      <button type="submit" disabled={loading} style={{ padding: '10px 20px', fontSize: '16px' }}>
        {loading ? 'Menyimpan...' : 'Simpan Pembaruan'}
      </button>
      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}
    </form>
  )
}

// Halaman kelola proker
// - Pengurus: organisasiId diisi → hanya organisasinya sendiri
// - Admin: organisasiId kosong → bisa pilih organisasi lewat tab
function KelolaProker({ organisasiId }) {
  const [organisasi, setOrganisasi] = useState([])
  const [orgAktif, setOrgAktif] = useState(organisasiId ?? null)
  const [kp, setKp] = useState(null)
  const [dimuat, setDimuat] = useState(false)
  const [dibuka, setDibuka] = useState(null)
  const [pesan, setPesan] = useState('')

  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [target, setTarget] = useState('')

  // Admin: ambil daftar organisasi untuk tab
  useEffect(() => {
    if (organisasiId) return
    supabase.from('organisasi').select('*').order('urutan')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setOrganisasi(data)
          setOrgAktif(data[0].id)
        }
      })
  }, [organisasiId])

  // Ambil kepengurusan terbaru + prokernya
  async function muat() {
    if (!orgAktif) return
    const { data, error } = await supabase.from('kepengurusan')
      .select('*, kandidat(nama_ketua), proker(*)')
      .eq('organisasi_id', orgAktif)
      .order('mulai', { ascending: false })
      .limit(1)
    if (error) setPesan(error.message)
    else setKp(data.length > 0 ? data[0] : null)
    setDimuat(true)
  }

  useEffect(() => {
    muat()
  }, [orgAktif])

  async function tambah(e) {
    e.preventDefault()
    setPesan('')
    const { error } = await supabase.from('proker').insert({
      kepengurusan_id: kp.id,
      judul: judul,
      deskripsi: deskripsi || null,
      target: target || null,
      urutan: kp.proker.length + 1,
    })
    if (error) setPesan(error.message)
    else {
      setJudul('')
      setDeskripsi('')
      setTarget('')
      muat()
    }
  }

  async function hapus(p) {
    if (!window.confirm(`Hapus proker "${p.judul}" beserta seluruh riwayatnya?`)) return
    const { error } = await supabase.from('proker').delete().eq('id', p.id)
    if (error) setPesan(error.message)
    else muat()
  }

  const daftar = kp ? [...kp.proker].sort((a, b) => a.urutan - b.urutan || a.id - b.id) : []

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
      <h2 style={{ textAlign: 'center' }}>Kelola Program Kerja</h2>

      {/* Tab organisasi (khusus admin) */}
      {!organisasiId && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
          {organisasi.map((o) => (
            <button key={o.id} onClick={() => setOrgAktif(o.id)}
              style={{ padding: '8px 20px', fontWeight: orgAktif === o.id ? 'bold' : 'normal' }}>
              {o.nama}
            </button>
          ))}
        </div>
      )}

      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}
      {dimuat && !kp && <p>Pemenang untuk organisasi ini belum ditetapkan panitia.</p>}

      {kp && (
        <div>
          <p style={{ textAlign: 'center' }}>Ketua: <b>{kp.kandidat.nama_ketua}</b></p>

          <section style={gayaKotak}>
            <h3>Tambah Proker Baru</h3>
            <form onSubmit={tambah}>
              <input required value={judul} onChange={(e) => setJudul(e.target.value)}
                placeholder="Nama program kerja" style={gayaInput} />
              <textarea rows={2} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Penjelasan singkat (opsional)" style={gayaInput} />
              <label>Target selesai (opsional)</label>
              <input type="date" value={target} onChange={(e) => setTarget(e.target.value)} style={gayaInput} />
              <button type="submit" style={{ padding: '10px 20px', fontSize: '16px' }}>Tambah Proker</button>
            </form>
          </section>

          {daftar.length === 0 && <p>Belum ada proker.</p>}

          {daftar.map((p) => (
            <section key={p.id} style={gayaKotak}>
              <b style={{ fontSize: '17px' }}>{p.judul}</b>
              <div style={{ fontSize: '14px', color: '#666', margin: '4px 0' }}>
                Status: {p.status} · Progres: {p.progres}%{p.target && ` · Target: ${p.target}`}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => setDibuka(dibuka === p.id ? null : p.id)}>
                  {dibuka === p.id ? 'Tutup' : 'Perbarui Progres'}
                </button>
                <button onClick={() => hapus(p)}>Hapus</button>
              </div>

              {dibuka === p.id && (
                <FormPerbarui proker={p} onSelesai={() => { setDibuka(null); muat() }} />
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export default KelolaProker