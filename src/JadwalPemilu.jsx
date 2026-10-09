import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const gayaInput = {
  display: 'block', width: '100%', padding: '10px', fontSize: '16px', marginBottom: '10px',
  borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit'
}

// Ubah waktu dari database ke format kolom isian (tanggal + jam)
function keIsian(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const z = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`
}

function JadwalPemilu() {
  const [mulai, setMulai] = useState('')
  const [selesai, setSelesai] = useState('')
  const [pesan, setPesan] = useState('')

  useEffect(() => {
    supabase.from('pengaturan').select('jadwal_mulai, jadwal_selesai').eq('id', 1).single()
      .then(({ data }) => {
        if (data) {
          setMulai(keIsian(data.jadwal_mulai))
          setSelesai(keIsian(data.jadwal_selesai))
        }
      })
  }, [])

  async function simpan(e) {
    e.preventDefault()
    setPesan('')
    const { error } = await supabase.rpc('atur_jadwal', {
      p_mulai: mulai ? new Date(mulai).toISOString() : null,
      p_selesai: selesai ? new Date(selesai).toISOString() : null,
    })
    setPesan(error ? '❌ ' + error.message : '✅ Jadwal tersimpan. Hitung mundur di halaman depan sudah diperbarui.')
  }

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
      <h3>Jadwal Pemilu (hitung mundur)</h3>
      <form onSubmit={simpan}>
        <label>Waktu mulai</label>
        <input type="datetime-local" required value={mulai} onChange={(e) => setMulai(e.target.value)} style={gayaInput} />
        <label>Waktu selesai (opsional)</label>
        <input type="datetime-local" value={selesai} onChange={(e) => setSelesai(e.target.value)} style={gayaInput} />
        <button type="submit">Simpan Jadwal</button>
      </form>
      {pesan && <p>{pesan}</p>}
    </section>
  )
}

export default JadwalPemilu