import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function BarisPetugas({ p, daftarBilik, onSimpan }) {
  const [nama, setNama] = useState(p.nama)
  const [bilikId, setBilikId] = useState(p.bilik_id ?? '')

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
      <span style={{ minWidth: '110px', fontSize: '14px', color: '#666' }}>Login: <b>{p.nis}</b></span>
      <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama petugas"
        style={{ flex: '1 1 160px', padding: '8px', fontSize: '15px', borderRadius: '8px', border: '1px solid #ccc' }} />
      <select value={bilikId} onChange={(e) => setBilikId(e.target.value)}
        style={{ padding: '8px', fontSize: '15px', borderRadius: '8px', border: '1px solid #ccc' }}>
        <option value="">— belum ditugaskan —</option>
        {daftarBilik.map((b) => (
          <option key={b.bilik_id} value={b.bilik_id}>{b.nama_bilik}</option>
        ))}
      </select>
      <button onClick={() => onSimpan(p, nama, bilikId)}>Simpan</button>
    </div>
  )
}

function PetugasBilik() {
  const [petugas, setPetugas] = useState([])
  const [daftarBilik, setDaftarBilik] = useState([])
  const [pesan, setPesan] = useState('')

  async function muat() {
    const { data: a, error } = await supabase.rpc('daftar_petugas')
    if (error) {
      setPesan(error.message)
      return
    }
    setPetugas(a)
    const { data: b } = await supabase.rpc('daftar_bilik')
    if (b) setDaftarBilik(b)
  }

  useEffect(() => {
    muat()
  }, [])

  async function simpan(p, nama, bilikId) {
    const { error } = await supabase.rpc('atur_petugas', {
      p_petugas: p.id,
      p_nama: nama,
      p_bilik: bilikId === '' ? null : Number(bilikId),
    })
    if (error) window.alert(error.message)
    else {
      window.alert('Pengaturan petugas tersimpan.')
      muat()
    }
  }

  return (
    <section className="kartu" style={{ maxWidth: '640px', margin: '24px auto 0', padding: '16px', textAlign: 'left' }}>
      <h3 style={{ marginTop: 0 }}>👥 Petugas Bilik (Admin OSIS)</h3>
      <p style={{ fontSize: '14px', color: '#666' }}>
        Isi nama asli petugas, lalu tentukan bilik yang ditanganinya. Petugas hanya bisa memasukkan pemilih ke bilik miliknya.
      </p>
      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}

      {petugas.map((p) => (
        <BarisPetugas key={`${p.id}-${p.nama}-${p.bilik_id ?? ''}`} p={p} daftarBilik={daftarBilik} onSimpan={simpan} />
      ))}
      {petugas.length === 0 && !pesan && <p>Belum ada akun petugas.</p>}
    </section>
  )
}

export default PetugasBilik