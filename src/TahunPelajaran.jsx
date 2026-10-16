import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function TahunPelajaran() {
  const [tahun, setTahun] = useState('')
  const [sibuk, setSibuk] = useState(false)

  useEffect(() => {
    supabase.from('pengaturan').select('tahun_pelajaran').eq('id', 1).single()
      .then(({ data }) => setTahun(data?.tahun_pelajaran || ''))
  }, [])

  async function simpan(e) {
    e.preventDefault()
    setSibuk(true)
    const { error } = await supabase.rpc('atur_tahun_pelajaran', { p_tahun: tahun })
    setSibuk(false)
    if (error) window.alert(error.message)
    else window.alert(`Tahun pelajaran ${tahun.trim()} tersimpan dan tampil di Beranda.`)
  }

  return (
    <form onSubmit={simpan} style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '16px', marginBottom: '16px', background: '#fff', textAlign: 'left' }}>
      <b>📅 Tahun Pelajaran</b>
      <p style={{ fontSize: '14px', color: '#666', margin: '4px 0 10px' }}>
        Tampil di bagian atas Beranda dan otomatis terisi di Berita Acara.
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input value={tahun} onChange={(e) => setTahun(e.target.value)} placeholder="Contoh: 2026/2027" required
          style={{ flex: '1 1 160px', padding: '10px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc' }} />
        <button type="submit" disabled={sibuk}>{sibuk ? 'Menyimpan...' : 'Simpan'}</button>
      </div>
    </form>
  )
}

export default TahunPelajaran