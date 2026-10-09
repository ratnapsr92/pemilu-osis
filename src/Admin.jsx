import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import MejaPanitia from './MejaPanitia'
import BeritaAcara from './BeritaAcara'
import ResetData from './ResetData'

const gayaKotak = {
  border: '1px solid #ddd', borderRadius: '12px', padding: '16px', marginBottom: '16px'
}

function Batang({ persen }) {
  return (
    <div style={{ background: '#eee', borderRadius: '8px', height: '20px' }}>
      <div style={{ width: persen + '%', background: '#4f46e5', height: '100%', borderRadius: '8px' }} />
    </div>
  )
}

function Admin() {
  const [dibuka, setDibuka] = useState(false)
  const [beranda, setBeranda] = useState('kampanye')
  const [partisipasi, setPartisipasi] = useState(null)
  const [hasil, setHasil] = useState([])
  const [pesan, setPesan] = useState('')

  async function muatData() {
    setPesan('')
    const { data: atur } = await supabase
      .from('pengaturan').select('voting_dibuka, beranda').eq('id', 1).single()
    const statusDibuka = atur ? atur.voting_dibuka : false
    setDibuka(statusDibuka)
    setBeranda(atur ? atur.beranda : 'kampanye')

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
    if (error) window.alert(error.message)
    else muatData()
  }

  async function tetapkan(h) {
    if (!window.confirm(`Tetapkan ${h.nama_ketua} sebagai pemenang ${h.nama_organisasi}?`)) return
    const { error } = await supabase.rpc('tetapkan_pemenang', { p_kandidat_id: h.kandidat_id })
    if (error) window.alert(error.message)
    else window.alert(`${h.nama_ketua} ditetapkan sebagai pemenang ${h.nama_organisasi}. Periode jabatan: 1 tahun mulai hari ini.`)
  }

  async function ubahBeranda(mode) {
    const { error } = await supabase.rpc('atur_beranda', { p_mode: mode })
    if (error) window.alert(error.message)
    else muatData()
  }

  async function unduhHadir() {
    const { data, error } = await supabase.rpc('daftar_hadir')
    if (error) {
      window.alert(error.message)
      return
    }
    const { data: org } = await supabase.from('organisasi').select('nama').order('urutan')
    const namaOrg = (org || []).map((o) => o.nama)
    const bersih = (t) => String(t ?? '').replace(/;/g, ',')

    const judul = ['No', 'NIS', 'Nama', 'Kelas', ...namaOrg, 'Keterangan']
    const baris = data.map((p, i) => [
      i + 1,
      `="${p.nis}"`,
      bersih(p.nama),
      bersih(p.kelas),
      ...namaOrg.map((n) => (p.organisasi_dipilih.includes(n) ? 'Sudah' : 'Belum')),
      p.selesai ? 'Hadir' : (p.organisasi_dipilih.length > 0 ? 'Sebagian' : 'Tidak hadir'),
    ])

    const hadir = data.filter((p) => p.selesai).length
    const tabel = [judul, ...baris].map((b) => b.join(';')).join('\r\n')
    const ringkasan = `\r\n\r\nTotal pemilih;${data.length}\r\nHadir;${hadir}\r\nTidak hadir / sebagian;${data.length - hadir}`

    const berkas = new Blob(['\uFEFF' + tabel + ringkasan], { type: 'text/csv;charset=utf-8' })
    const alamat = URL.createObjectURL(berkas)
    const tautan = document.createElement('a')
    tautan.href = alamat
    tautan.download = `daftar-hadir-pemilu-${new Date().toISOString().slice(0, 10)}.csv`
    tautan.click()
    setTimeout(() => URL.revokeObjectURL(alamat), 1000)
  }
    const total = partisipasi ? Number(partisipasi.total) : 0
  const sudah = partisipasi ? Number(partisipasi.sudah) : 0
  const persenHadir = total > 0 ? Math.round((sudah / total) * 100) : 0

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
        <button onClick={() => ubahVoting(!dibuka)}>
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
        {!dibuka && (
          <button onClick={unduhHadir} className="tombol-kedua" style={{ marginBottom: '16px' }}>
            ⬇ Unduh Daftar Hadir (Excel)
          </button>
        )}
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
                    <div key={h.kandidat_id} style={{ marginBottom: '16px' }}>
                      <p>{h.nomor_urut}. {h.nama_ketua}: <b>{h.jumlah} suara</b> ({persen}%)</p>
                      <Batang persen={persen} />
                      <button onClick={() => tetapkan(h)} className="tombol-kedua" style={{ marginTop: '6px', fontSize: '13px' }}>
                        Tetapkan Pemenang
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })
        )}
      </section>

      {!dibuka && <BeritaAcara />}
      {!dibuka && <ResetData onSelesai={muatData} />}

      <section style={gayaKotak}>
        <h3>Halaman Beranda Publik</h3>
        <p>Saat ini menampilkan: <b>{beranda === 'proker' ? 'Tracker Proker' : 'Kampanye Kandidat'}</b></p>
        <button onClick={() => ubahBeranda(beranda === 'proker' ? 'kampanye' : 'proker')}>
          {beranda === 'proker' ? 'Ganti ke Kampanye' : 'Ganti ke Tracker Proker'}
        </button>
      </section>
    </div>
  )
}

export default Admin
