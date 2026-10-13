import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const gayaInput = {
  display: 'block', width: '100%', padding: '10px', fontSize: '16px', marginBottom: '10px',
  borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit'
}

function KoreksiMemilih() {
  const [organisasi, setOrganisasi] = useState([])
  const [jenis, setJenis] = useState('tukar')
  const [orgId, setOrgId] = useState('')
  const [nisDari, setNisDari] = useState('')
  const [nisKe, setNisKe] = useState('')
  const [alasan, setAlasan] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('organisasi').select('id, nama').order('urutan')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setOrganisasi(data)
          setOrgId(String(data[0].id))
        }
      })
  }, [])

  async function kirim(e) {
    e.preventDefault()
    const namaOrg = organisasi.find((o) => String(o.id) === orgId)?.nama
    const teks = jenis === 'tukar'
      ? `Pindahkan status "sudah memilih ${namaOrg}" dari NIS ${nisDari} ke NIS ${nisKe}?`
      : `Pulihkan hak pilih ${namaOrg} untuk NIS ${nisDari}? Siswa ini akan bisa memilih lagi.`
    if (!window.confirm(teks + '\n\nTindakan ini tercatat di log.')) return

    setLoading(true)
    const { data, error } = await supabase.rpc('koreksi_status_memilih', {
      p_pin: pin, p_jenis: jenis, p_nis_dari: nisDari, p_nis_ke: jenis === 'tukar' ? nisKe : null,
      p_organisasi: Number(orgId), p_alasan: alasan,
    })
    setLoading(false)
    setPin('')
    if (error) return window.alert(error.message)
    if (data !== 'ok') return window.alert(data)
    window.alert('Koreksi berhasil dan sudah tercatat di log. Catat juga di berita acara.')
    setNisDari('')
    setNisKe('')
    setAlasan('')
  }
    return (
    <section style={{ border: '2px solid #f59e0b', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'left', background: '#fffbeb' }}>
      <h3 style={{ marginTop: 0 }}>🛠️ Koreksi Status Memilih</h3>
      <p style={{ fontSize: '14px', color: '#666' }}>
        Gunakan jika ada siswa yang tercatat sudah memilih padahal belum. Periksa <b>Log</b> terlebih dahulu
        (cari "Mengaktifkan bilik ... untuk [nama siswa]") untuk mengetahui apa yang terjadi.
      </p>

      <form onSubmit={kirim}>
        <label>Jenis koreksi</label>
        <select value={jenis} onChange={(e) => setJenis(e.target.value)} style={gayaInput}>
          <option value="tukar">Salah input petugas: pindahkan status ke siswa yang sebenarnya memilih</option>
          <option value="pulihkan">Identitas dipakai orang lain (tidak diketahui): pulihkan hak pilih</option>
        </select>

        <label>Organisasi</label>
        <select value={orgId} onChange={(e) => setOrgId(e.target.value)} style={gayaInput}>
          {organisasi.map((o) => <option key={o.id} value={o.id}>{o.nama}</option>)}
        </select>

        <label>NIS siswa yang tercatat sudah memilih (padahal belum)</label>
        <input required value={nisDari} onChange={(e) => setNisDari(e.target.value)} style={gayaInput} />

        {jenis === 'tukar' && (
          <>
            <label>NIS siswa yang sebenarnya sudah memilih</label>
            <input required value={nisKe} onChange={(e) => setNisKe(e.target.value)} style={gayaInput} />
          </>
        )}

        <label>Alasan / kronologi singkat</label>
        <textarea required rows={2} value={alasan} onChange={(e) => setAlasan(e.target.value)}
          placeholder="Contoh: Petugas Bilik 2 salah klik nama pukul 08.15, dikonfirmasi saksi."
          style={gayaInput} />

        <label>PIN keamanan</label>
        <input type="password" required autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value)} style={gayaInput} />

        <button type="submit" disabled={loading} style={{ background: '#d97706' }}>
          {loading ? 'Memproses...' : 'Simpan Koreksi'}
        </button>
      </form>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: 0 }}>
        Koreksi dilakukan per organisasi. Jika siswa terdampak di OSIS dan Dewan, lakukan dua kali.
      </p>
    </section>
  )
}

export default KoreksiMemilih