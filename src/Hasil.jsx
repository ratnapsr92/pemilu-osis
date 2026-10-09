import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function Hasil() {
  const [baris, setBaris] = useState([])
  const [dimuat, setDimuat] = useState(false)

  useEffect(() => {
    async function muat() {
      const { data } = await supabase.rpc('hasil_publik')
      setBaris(data || [])
      setDimuat(true)
    }
    muat()
    const timer = setInterval(muat, 30000)
    return () => clearInterval(timer)
  }, [])

  // Kelompokkan per organisasi
  const kelompok = []
  for (const b of baris) {
    let g = kelompok.find((x) => x.id === b.organisasi_id)
    if (!g) {
      g = { id: b.organisasi_id, nama: b.nama_organisasi, total: Number(b.total_pemilih), hadir: Number(b.pemilih_organisasi), kandidat: [] }
      kelompok.push(g)
    }
    g.kandidat.push(b)
  }

  if (dimuat && kelompok.length === 0) {
    return <p>Hasil pemilihan belum diumumkan.</p>
  }

  return (
    <div style={{ display: 'grid', gap: '24px', textAlign: 'left' }}>
      {kelompok.map((g) => {
        const totalSuara = g.kandidat.reduce((j, k) => j + Number(k.jumlah), 0)
        const urut = [...g.kandidat].sort((a, b) => Number(b.jumlah) - Number(a.jumlah))
                const terpilih = g.kandidat.find((k) => k.ditetapkan)
        const menang = terpilih ? terpilih.kandidat_id : null
        const persenHadir = g.total > 0 ? Math.round((g.hadir / g.total) * 100) : 0

        return (
          <section key={g.id} className="kartu" style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 4px' }}>{g.nama}</h2>
            <p style={{ margin: '0 0 16px', color: 'var(--teks-redup)', fontSize: '14px' }}>
              Partisipasi: {g.hadir} dari {g.total} pemilih ({persenHadir}%) · {totalSuara} suara sah
            </p>

            {urut.map((k) => {
              const persen = totalSuara > 0 ? Math.round((Number(k.jumlah) / totalSuara) * 100) : 0
              const juara = k.kandidat_id === menang
              return (
                <div key={k.kandidat_id} style={{
                  display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', marginBottom: '10px',
                  borderRadius: '12px', background: juara ? '#fef3c7' : '#f9fafb',
                  border: juara ? '2px solid #f59e0b' : '1px solid var(--garis)'
                }}>
                  {k.foto_url ? (
                    <img src={k.foto_url} alt={k.nama_ketua}
                      style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#e5e7eb', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <b>{k.nomor_urut}. {k.nama_ketua}{juara && ' 🏆 Terpilih'}</b>
                      <b>{k.jumlah} suara ({persen}%)</b>
                    </div>
                    {k.nama_wakil && (
                      <div style={{ fontSize: '14px', color: 'var(--teks-redup)' }}>Wakil: {k.nama_wakil}</div>
                    )}
                    <div style={{ background: '#e5e7eb', borderRadius: '8px', height: '12px', marginTop: '8px' }}>
                      <div style={{
                        width: persen + '%', height: '100%', borderRadius: '8px',
                        background: juara ? '#f59e0b' : 'var(--utama)'
                      }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}

export default Hasil
