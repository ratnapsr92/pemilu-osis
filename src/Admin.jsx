import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import MejaPanitia from './MejaPanitia'

const gayaKotak = {
  border: '1px solid #ddd', borderRadius: '12px', padding: '16px', marginBottom: '16px'
}

// Komponen batang persentase
function Batang({ persen }) {
  return (
    <div style={{ background: '#eee', borderRadius: '8px', height: '20px' }}>
      <div style={{ width: persen + '%', background: '#4f46e5', height: '100%', borderRadius: '8px' }} />
    </div>
  )
}

function Admin() {
  const [dibuka, setDibuka] = useState(false)
  const [partisipasi, setPartisipasi] = useState(null)
  const [hasil, setHasil] = useState([])
  const [pesan, setPesan] = useState('')

  async function muatData() {
    setPesan('')

    const { data: atur } = await supabase
      .from('pengaturan').select('voting_dibuka').eq('id', 1).single()
    const statusDibuka = atur ? atur.voting_dibuka : false
    setDibuka(statusDibuka)

    const { data: p, error: e1 } = await supabase.rpc('partisipasi')
    if (e1) setPesan(e1.message)
    else setPartisipasi(p[0])

    if (!statusDibuka) {
      const { data: h, error: e2 } = await supabase.rpc('hasil_suara')
      if (e2) setPesan(e2.message)
      else setHasil(h)
    } else {
      setHasil([])
    }
  }

  useEffect(() => {
    muatData()
    const timer = setInterval(muatData, 10000)
    return () => clearInterval(timer)
  }, [])

  async function ubahVoting(buka) {
    const teks = buka ? 'MEMBUKA' : 'MENUTUP'
    if (!window.confirm(`Yakin ${teks} voting?`)) return

    const { error } = await supabase.rpc('atur_voting', { p_dibuka: buka })
    if (error) setPesan(error.message)
    else muatData()
  }

  const total = partisipasi ? Number(partisipasi.total) : 0
  const sudah = partisipasi ? Number(partisipasi.sudah) : 0
  const persenHadir = total > 0 ? Math.round((sudah / total) * 100) : 0

  // Kelompokkan hasil per organisasi
  const kelompok = {}
  for (const h of hasil) {
    if (!kelompok[h.nama_organisasi]) kelompok[h.nama_organisasi] = []
    kelompok[h.nama_organisasi].push(h)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
      <h2 style={{ textAlign: 'center' }}>Dashboard Panitia</h2>
      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}

      <section style={gayaKotak}>
        <h3>Status Voting: {dibuka ? '🟢 DIBUKA' : '🔴 DITUTUP'}</h3>
        <button onClick={() => ubahVoting(!dibuka)} style={{ padding: '10px 20px', fontSize: '16px' }}>
          {dibuka ? 'Tutup Voting' : 'Buka Voting'}
        </button>
      </section>

      {dibuka && <MejaPanitia />}

      <section style={gayaKotak}>
        <h3>Partisipasi Pemilih</h3>
        <p>{sudah} dari {total} pemilih sudah selesai memilih ({persenHadir}%)</p>
        <Batang persen={persenHadir} />
      </section>

      <section style={gayaKotak}>
        <h3>Hasil Perolehan Suara</h3>
        {dibuka ? (
          <p>Hasil akan tampil setelah voting ditutup.</p>
        ) : (
          Object.entries(kelompok).map(([namaOrg, daftar]) => {
            const totalSuara = daftar.reduce((jumlah, h) => jumlah + Number(h.jumlah), 0)
            return (
              <div key={namaOrg} style={{ marginBottom: '24px' }}>
                <h4>{namaOrg} (total {totalSuara} suara)</h4>
                {daftar.map((h) => {
                  const persen = totalSuara > 0 ? Math.round((Number(h.jumlah) / totalSuara) * 100) : 0
                  return (
                    <div key={h.kandidat_id} style={{ marginBottom: '12px' }}>
                      <p>{h.nomor_urut}. {h.nama_ketua}: <b>{h.jumlah} suara</b> ({persen}%)</p>
                      <Batang persen={persen} />
                    </div>
                  )
                })}
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}

export default Admin