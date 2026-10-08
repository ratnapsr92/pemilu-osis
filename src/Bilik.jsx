import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Kandidat from './Kandidat'

function Bilik({ namaBilik }) {
  const [giliran, setGiliran] = useState(null)
  const [selesai, setSelesai] = useState(false)

  // Cek setiap 3 detik: apakah panitia sudah mengirim pemilih ke bilik ini?
  useEffect(() => {
    async function cek() {
      const { data } = await supabase.rpc('giliran_saya')
      setGiliran(data && data.length > 0 ? data[0] : null)
    }
    cek()
    const timer = setInterval(cek, 3000)
    return () => clearInterval(timer)
  }, [])

  function setelahMemilih() {
    setSelesai(true)
    setGiliran(null)
    setTimeout(() => setSelesai(false), 5000) // layar terima kasih selama 5 detik
  }

  function keluar() {
    if (window.confirm('Keluarkan tablet ini dari akun bilik?')) supabase.auth.signOut()
  }

  if (selesai) {
    return (
      <div>
        <h2>Terima kasih! ✅</h2>
        <p style={{ fontSize: '20px' }}>Suara Anda sudah tercatat dan dirahasiakan.</p>
      </div>
    )
  }

  if (!giliran) {
    return (
      <div>
        <h2>{namaBilik}</h2>
        <p style={{ fontSize: '22px' }}>Silakan menunggu giliran dari panitia.</p>
        <button onClick={keluar} style={{ marginTop: '48px', fontSize: '12px', opacity: 0.5 }}>
          Keluar
        </button>
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontSize: '22px' }}>
        Halo, <b>{giliran.nama}</b> {giliran.kelas && `(${giliran.kelas})`}
      </p>
      <Kandidat dibuka={true} onSelesai={setelahMemilih} />
    </div>
  )
}

export default Bilik