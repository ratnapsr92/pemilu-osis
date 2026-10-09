import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Kandidat from './Kandidat'

const gayaTombolMenu = {
  display: 'block', width: '100%', maxWidth: '360px', margin: '12px auto',
  padding: '20px', fontSize: '22px', borderRadius: '12px'
}

function Bilik({ namaBilik, onTerlepas }) {
  const [organisasi, setOrganisasi] = useState([])
  const [giliran, setGiliran] = useState(null)
  const [pilihanOrg, setPilihanOrg] = useState(null)
  const [selesai, setSelesai] = useState(false)

  // Cek status bilik & giliran pemilih
  async function cek() {
    const { data, error } = await supabase.rpc('giliran_saya')
    if (error) return
    if (!data || data.length === 0) {
      onTerlepas()   // bilik dilepas / dihapus admin
      return
    }
    const baris = data[0]
    const g = baris.nama ? { nama: baris.nama, kelas: baris.kelas, sudah: baris.sudah || [] } : null
    setGiliran(g)
    if (!g) setPilihanOrg(null)
  }
  useEffect(() => {
    supabase.from('organisasi').select('*').order('urutan')
      .then(({ data }) => {
        if (data) setOrganisasi(data)
      })
    cek()
    const timer = setInterval(cek, 3000)
    return () => clearInterval(timer)
  }, [])

  function setelahMemilih(hasil) {
    setPilihanOrg(null)
    if (hasil === 'selesai') {
      setSelesai(true)
      setGiliran(null)
      setTimeout(() => setSelesai(false), 5000)
    } else {
      cek()
    }
  }
      // Layar terima kasih
  if (selesai) {
    return (
      <div>
        <h2>Terima kasih! ✅</h2>
        <p style={{ fontSize: '20px' }}>Semua suara Anda sudah tercatat dan dirahasiakan.</p>
      </div>
    )
  }

  // Layar menunggu giliran
  if (!giliran) {
    return (
      <div>
        <h2>{namaBilik}</h2>
        <p style={{ fontSize: '22px' }}>Silakan menunggu giliran dari panitia.</p>
      </div>
    )
  }

  // Surat suara organisasi yang dipilih
  if (pilihanOrg) {
    return (
      <Kandidat organisasi={pilihanOrg} onSelesai={setelahMemilih} onKembali={() => setPilihanOrg(null)} />
    )
  }

  // Menu pilih surat suara
  return (
    <div>
      <p style={{ fontSize: '22px' }}>
        Halo, <b>{giliran.nama}</b> {giliran.kelas && `(${giliran.kelas})`}
      </p>
      <p style={{ fontSize: '18px' }}>Silakan pilih surat suara:</p>
      {organisasi.map((o) => {
        const sudah = giliran.sudah.includes(o.id)
        return (
          <button key={o.id} disabled={sudah} onClick={() => setPilihanOrg(o)} style={gayaTombolMenu}>
            {sudah ? `✅ ${o.nama} (sudah dipilih)` : `Pilih ${o.nama}`}
          </button>
        )
      })}
    </div>
  )
}

export default Bilik