import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const gayaKotak = {
  border: '1px solid #ddd', borderRadius: '12px', padding: '16px', marginBottom: '12px', background: '#fff'
}

function KelolaBilik() {
  const [daftar, setDaftar] = useState([])
  const [nama, setNama] = useState('')
  const [kodeBaru, setKodeBaru] = useState(null)
  const [pesan, setPesan] = useState('')

  async function muat() {
    const { data, error } = await supabase.rpc('daftar_bilik')
    if (error) setPesan(error.message)
    else setDaftar(data)
  }

  useEffect(() => {
    muat()
    const timer = setInterval(muat, 5000)
    return () => clearInterval(timer)
  }, [])

  async function tambah(e) {
    e.preventDefault()
    setPesan('')
    const { data, error } = await supabase.rpc('tambah_bilik', { p_nama: nama })
    if (error) {
      setPesan(error.message)
      return
    }
    setKodeBaru({ nama: nama, kode: data })
    setNama('')
    muat()
  }

  async function gantiKode(b) {
    if (!window.confirm(`Ganti kode ${b.nama_bilik}?\nTablet yang terpasang akan terlepas dan harus memasukkan kode baru.`)) return
    const { data, error } = await supabase.rpc('ganti_kode_bilik', { p_bilik_id: b.bilik_id })
    if (error) {
      setPesan(error.message)
      return
    }
    setKodeBaru({ nama: b.nama_bilik, kode: data })
    muat()
  }

  async function lepas(b) {
    if (!window.confirm(`Lepas tablet dari ${b.nama_bilik}?`)) return
    const { error } = await supabase.rpc('lepas_tablet', { p_bilik_id: b.bilik_id })
    if (error) setPesan(error.message)
    else muat()
  }

  async function hapus(b) {
    if (!window.confirm(`Hapus ${b.nama_bilik}?`)) return
    const { error } = await supabase.rpc('hapus_bilik', { p_bilik_id: b.bilik_id })
    if (error) setPesan(error.message)
    else muat()
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'left' }}>
      <h2 style={{ textAlign: 'center' }}>Kelola Bilik Suara</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Setiap bilik memiliki kode 6 angka. Di tablet, buka menu <b>Masuk → Tablet Bilik</b>, lalu ketik kodenya.
        Kode hanya ditampilkan sekali. Jika lupa, gunakan <b>Ganti Kode</b>.
      </p>

      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}

      {kodeBaru && (
        <div style={{ ...gayaKotak, border: '2px solid #16a34a', background: '#f0fdf4', textAlign: 'center' }}>
          <div>Kode untuk <b>{kodeBaru.nama}</b>:</div>
          <div style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '8px', margin: '8px 0' }}>{kodeBaru.kode}</div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            Catat atau langsung ketik kode ini di tablet. Setelah ditutup, kode tidak bisa dilihat lagi.
          </div>
          <button className="tombol-kedua" onClick={() => setKodeBaru(null)} style={{ marginTop: '10px' }}>Tutup</button>
        </div>
      )}

      <form onSubmit={tambah} style={{ ...gayaKotak, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input required value={nama} onChange={(e) => setNama(e.target.value)}
          placeholder={`Contoh: Bilik ${daftar.length + 1}`}
          style={{ flex: 1, minWidth: '160px', padding: '10px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc' }} />
        <button type="submit">+ Tambah Bilik</button>
      </form>

      {daftar.map((b) => (
        <div key={b.bilik_id} style={{ ...gayaKotak, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div>
            <b>{b.nama_bilik}</b>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {b.terpasang ? '🟢 Tablet terpasang' : '⚪ Belum ada tablet'}
              {b.nama_pemilih && ` · sedang dipakai ${b.nama_pemilih}`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button className="tombol-kedua" onClick={() => gantiKode(b)}>Ganti Kode</button>
            {b.terpasang && <button className="tombol-kedua" onClick={() => lepas(b)}>Lepas Tablet</button>}
            <button onClick={() => hapus(b)} style={{ background: '#dc2626' }}>Hapus</button>
          </div>
        </div>
      ))}

      {daftar.length === 0 && <p>Belum ada bilik. Tambahkan sesuai jumlah tablet yang tersedia.</p>}
    </div>
  )
}

export default KelolaBilik