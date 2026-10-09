import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function PengumumanHasil() {
  const [diumumkan, setDiumumkan] = useState(false)

  async function muat() {
    const { data } = await supabase.from('pengaturan').select('hasil_diumumkan').eq('id', 1).single()
    if (data) setDiumumkan(data.hasil_diumumkan)
  }

  useEffect(() => {
    muat()
  }, [])

  async function ubah() {
    const teks = diumumkan
      ? 'Sembunyikan hasil dari halaman publik?'
      : 'Umumkan hasil? Semua orang dapat melihat perolehan suara di menu Hasil.'
    if (!window.confirm(teks)) return

    const { error } = await supabase.rpc('atur_pengumuman', { p_umumkan: !diumumkan })
    if (error) window.alert(error.message)
    else muat()
  }

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
      <h3>Pengumuman Hasil</h3>
      <p>Status: <b>{diumumkan ? '📢 Diumumkan (bisa dilihat semua orang)' : '🔒 Belum diumumkan'}</b></p>
      <button onClick={ubah} className={diumumkan ? 'tombol-kedua' : ''}>
        {diumumkan ? 'Sembunyikan Hasil' : '📢 Umumkan Hasil'}
      </button>
    </section>
  )
}

export default PengumumanHasil