import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function SakelarProker() {
  const [tampil, setTampil] = useState(null)
  const [sibuk, setSibuk] = useState(false)

  useEffect(() => {
    supabase.from('pengaturan').select('proker_ditampilkan').eq('id', 1).single()
      .then(({ data }) => setTampil(data ? data.proker_ditampilkan : false))
  }, [])

  async function ubah() {
    const baru = !tampil
    const tanya = baru
      ? 'Tampilkan halaman Proker ke publik?\nPastikan program kerja OSIS dan Dewan sudah diisi.'
      : 'Sembunyikan halaman Proker dari publik?'
    if (!window.confirm(tanya)) return
    setSibuk(true)
    const { error } = await supabase.rpc('atur_tampil_proker', { p_tampil: baru })
    setSibuk(false)
    if (error) window.alert(error.message)
    else setTampil(baru)
  }

  if (tampil === null) return null

  return (
    <section style={{
      border: `2px solid ${tampil ? '#16a34a' : '#f59e0b'}`, borderRadius: '12px', padding: '14px 16px',
      marginBottom: '16px', background: tampil ? '#f0fdf4' : '#fffbeb',
      display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap',
    }}>
      <div style={{ flex: '1 1 240px' }}>
        <b>{tampil ? '🟢 Proker tampil di halaman publik' : '🔒 Proker disembunyikan dari publik'}</b>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {tampil
            ? 'Pengunjung bisa melihat tracker program kerja.'
            : 'Menu Proker tetap ada, tetapi isinya belum terlihat oleh pengunjung.'}
        </div>
      </div>
      <button onClick={ubah} disabled={sibuk} style={{ background: tampil ? '#dc2626' : '#16a34a' }}>
        {tampil ? 'Sembunyikan' : '📋 Tampilkan Proker'}
      </button>
    </section>
  )
}

export default SakelarProker