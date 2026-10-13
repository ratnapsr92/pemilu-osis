import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function Integritas() {
  const [data, setData] = useState([])
  const [peringatan, setPeringatan] = useState(0)
  const [pesan, setPesan] = useState('')

  async function muat() {
    const { data: hasil, error } = await supabase.rpc('cek_integritas')
    if (error) {
      setPesan(error.message)
      return
    }
    setData(hasil)
    const { count } = await supabase.from('log_admin')
      .select('*', { count: 'exact', head: true })
      .like('aksi', '⚠️%')
    setPeringatan(count || 0)
  }

  useEffect(() => {
    muat()
    const timer = setInterval(muat, 10000)
    return () => clearInterval(timer)
  }, [])

  const aman = data.every((d) => d.cocok) && peringatan === 0

  return (
    <section style={{
      border: `2px solid ${aman ? '#16a34a' : '#dc2626'}`, background: aman ? '#f0fdf4' : '#fef2f2',
      borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'left'
    }}>
      <h3 style={{ marginTop: 0 }}>
        {aman ? '🛡️ Integritas Suara: AMAN' : '🚨 Integritas Suara: PERLU DIPERIKSA'}
      </h3>
      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}

      {data.map((d) => (
        <div key={d.nama_organisasi} style={{ marginBottom: '4px' }}>
          {d.cocok ? '✅' : '❌'} <b>{d.nama_organisasi}</b>: {d.jumlah_suara} surat suara ·{' '}
          {d.jumlah_pemilih_memilih} pemilih tercatat memilih
        </div>
      ))}

      <div style={{ marginTop: '8px', fontSize: '14px' }}>
        {peringatan === 0
          ? 'Tidak ada perubahan data suara di luar prosedur.'
          : `⚠️ Ada ${peringatan} catatan perubahan data suara di luar prosedur. Periksa Log Aktivitas.`}
      </div>
    </section>
  )
}

export default Integritas