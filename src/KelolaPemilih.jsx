import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import KodeSiswa from './KodeSiswa'

const gayaKotak = {
  border: '1px solid #ddd', borderRadius: '12px', padding: '16px', marginBottom: '16px', background: '#fff'
}
const gayaInput = {
  display: 'block', width: '100%', padding: '10px', fontSize: '16px', marginBottom: '10px',
  borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit'
}

export const labelJenis = { tambah: '➕ Tambah', ubah: '✏️ Ubah', hapus: '🗑️ Hapus' }
export const labelStatus = { menunggu: '⏳ Menunggu', disetujui: '✅ Disetujui', ditolak: '❌ Ditolak' }
export const formatWaktu = (t) => t ? new Date(t).toLocaleString('id-ID', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
}) : '-'
// Form usulan tambah / ubah pemilih
function FormUsulan({ jenis, pemilih, onSelesai, onBatal }) {
  const [nomor, setNomor] = useState(pemilih?.nomor_absen ?? '')
  const [nis, setNis] = useState(pemilih?.nis ?? '')
  const [nama, setNama] = useState(pemilih?.nama ?? '')
  const [kelas, setKelas] = useState(pemilih?.kelas ?? '')
  const [pesan, setPesan] = useState('')

  async function kirim(e) {
    e.preventDefault()
    setPesan('')
    const { error } = await supabase.rpc('usulkan_pemilih', {
      p_jenis: jenis, p_pemilih_id: pemilih ? pemilih.id : null,
      p_nis: nis, p_nama: nama, p_kelas: kelas, p_nomor: nomor === '' ? null : Number(nomor),
    })
    if (error) return setPesan(error.message)
    window.alert('Usulan dikirim. Perubahan berlaku setelah disetujui Ketua KPU.')
    onSelesai()
  }

  return (
    <form onSubmit={kirim} style={{ ...gayaKotak, border: '2px solid #4f46e5' }}>
      <h3 style={{ marginTop: 0 }}>{jenis === 'tambah' ? 'Usulkan Pemilih Baru' : 'Usulkan Perubahan Data'}</h3>
      <label>Nomor absen</label>
      <input type="number" min="1" value={nomor} onChange={(e) => setNomor(e.target.value)} style={gayaInput} />
      <label>NIS</label>
      <input required value={nis} onChange={(e) => setNis(e.target.value)} style={gayaInput} />
      <label>Nama lengkap</label>
      <input required value={nama} onChange={(e) => setNama(e.target.value)} style={gayaInput} />
      <label>Kelas (atau "Guru")</label>
      <input value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="Contoh: 7A" style={gayaInput} />
      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit">Kirim Usulan</button>
        <button type="button" className="tombol-kedua" onClick={onBatal}>Batal</button>
      </div>
    </form>
  )
}
function KelolaPemilih() {
  const [kata, setKata] = useState('')
  const [daftar, setDaftar] = useState([])
  const [usulan, setUsulan] = useState([])
  const [dibuka, setDibuka] = useState(false)
  const [form, setForm] = useState(null)

  async function cari(e) {
    if (e) e.preventDefault()
    const { data, error } = await supabase.rpc('daftar_pemilih_admin', { p_kata: kata })
    if (error) window.alert(error.message)
    else setDaftar(data)
  }
  async function muatUsulan() {
    const { data } = await supabase.rpc('daftar_usulan')
    if (data) setUsulan(data)
  }
  useEffect(() => {
    supabase.from('pengaturan').select('voting_dibuka').eq('id', 1).single()
      .then(({ data }) => setDibuka(data ? data.voting_dibuka : false))
    cari()
    muatUsulan()
  }, [])

  async function usulHapus(p) {
    if (!window.confirm(`Usulkan penghapusan ${p.nama} (${p.nis})?`)) return
    const { error } = await supabase.rpc('usulkan_pemilih', {
      p_jenis: 'hapus', p_pemilih_id: p.id, p_nis: null, p_nama: null, p_kelas: null, p_nomor: null,
    })
    if (error) window.alert(error.message)
    else { window.alert('Usulan penghapusan dikirim ke Ketua KPU.'); muatUsulan() }
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'left' }}>
      <h2 style={{ textAlign: 'center' }}>Data Pemilih</h2>
      <p style={{ fontSize: '14px', color: '#666' }}>Perubahan data pemilih berlaku setelah <b>disetujui Ketua KPU</b>.</p>
      {dibuka && <p style={{ background: '#fef3c7', padding: '10px', borderRadius: '8px' }}>🔒 Voting sedang dibuka. Data pemilih terkunci.</p>}
      {!dibuka && !form && <button onClick={() => setForm({ jenis: 'tambah' })} style={{ marginBottom: '16px' }}>+ Usulkan Pemilih Baru</button>}
      {form && <FormUsulan key={form.pemilih?.id ?? 'baru'} jenis={form.jenis} pemilih={form.pemilih}
        onSelesai={() => { setForm(null); muatUsulan() }} onBatal={() => setForm(null)} />}

      {usulan.length > 0 && (
        <section style={gayaKotak}>
          <h3 style={{ marginTop: 0 }}>Usulan & Statusnya</h3>
          {usulan.slice(0, 20).map((u) => (
            <div key={u.id} style={{ padding: '6px 0', borderBottom: '1px solid #eee', fontSize: '14px' }}>
              <b>{labelStatus[u.status]}</b> · {labelJenis[u.jenis]} · {u.nis} – {u.nama} {u.catatan && `· Catatan: ${u.catatan}`}
            </div>
          ))}
        </section>
      )}

      <form onSubmit={cari} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input value={kata} onChange={(e) => setKata(e.target.value)} placeholder="Cari nomor absen, NIS, nama, atau kelas"
          style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc' }} />
        <button type="submit">Cari</button>
      </form>
      <div className="kartu">
        {daftar.map((p) => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '10px 14px', borderBottom: '1px solid #eee' }}>
            <span><b>{p.nomor_absen ? `No. ${p.nomor_absen}` : 'No. -'}</b> · {p.nis} – {p.nama} {p.kelas && `(${p.kelas})`} {p.sudah_memilih && '· ✅'}</span>
            {!dibuka && (
              <span style={{ display: 'flex', gap: '6px' }}>
                <button className="tombol-kedua" onClick={() => setForm({ jenis: 'ubah', pemilih: p })}>Ubah</button>
                <button onClick={() => usulHapus(p)} style={{ background: '#dc2626' }}>Hapus</button>
              </span>
            )}
          </div>
        ))}
        {daftar.length === 0 && <p style={{ padding: '14px' }}>Tidak ada data.</p>}
      </div>
      <KodeSiswa />
    </div>
  )
}

export default KelolaPemilih