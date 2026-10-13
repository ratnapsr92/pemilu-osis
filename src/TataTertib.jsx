import { useState } from 'react'
import { supabase } from './supabase'

const gayaInput = {
  display: 'block', width: '100%', padding: '10px', fontSize: '16px', marginBottom: '10px',
  borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit'
}

export const isiTataTertib = [
  'PIN keamanan dan password akun Ketua KPU bersifat rahasia dan tidak boleh diberikan atau diperlihatkan kepada siapa pun.',
  'Fitur Hapus Data hanya boleh digunakan setelah simulasi atas kesepakatan panitia, atau untuk memulai pemilu baru setelah berita acara pemilu sebelumnya ditandatangani dan diarsipkan.',
  'Dilarang menghapus atau mengubah data suara dan hasil pemilu sebelum berita acara ditandatangani oleh panitia, saksi, dan kepala sekolah.',
  'Setiap persetujuan penambahan atau perubahan data pemilih wajib dicocokkan dengan data resmi sekolah.',
  'Ketua KPU wajib memeriksa Indikator Integritas Suara sebelum dan sesudah voting ditutup, dan segera melapor kepada kepala sekolah jika muncul peringatan.',
  'Seluruh tindakan tercatat otomatis di Log Aktivitas, tidak dapat dihapus, dan dapat diperiksa oleh kepala sekolah serta saksi.',
  'Jika lupa PIN atau password, atau mencurigai adanya kebocoran, segera melapor kepada pengelola aplikasi.',
  'Keluar (logout) dari akun setelah selesai, dan tidak meninggalkan perangkat dalam keadaan masih masuk.',
]

function TataTertib({ nama, onSelesai }) {
  const [sandi, setSandi] = useState('')
  const [ulangi, setUlangi] = useState('')
  const [setuju, setSetuju] = useState(false)
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(false)

  async function kirim(e) {
    e.preventDefault()
    setPesan('')
    if (sandi.length < 8) {
      setPesan('Password baru minimal 8 karakter.')
      return
    }
    if (sandi !== ulangi) {
      setPesan('Konfirmasi password tidak sama.')
      return
    }

    setLoading(true)
    const { error: errSandi } = await supabase.auth.updateUser({ password: sandi })
    if (errSandi) {
      setLoading(false)
      setPesan('Gagal mengganti password: ' + errSandi.message)
      return
    }
    const { error } = await supabase.rpc('setuju_tata_tertib')
    setLoading(false)
    if (error) setPesan(error.message)
    else onSelesai()
  }

  return (
    <div className="kartu" style={{ maxWidth: '640px', margin: '0 auto', padding: '24px', textAlign: 'left' }}>
      <h2 style={{ marginTop: 0 }}>Selamat datang, {nama}</h2>
      <p>
        Sebagai <b>Ketua KPU</b>, Anda memegang kunci keamanan pemilu.
        Bacalah tata tertib berikut, lalu buat password baru sebelum melanjutkan.
      </p>

      <h3>Tata Tertib Ketua KPU</h3>
      <ol style={{ paddingLeft: '20px' }}>
        {isiTataTertib.map((butir, i) => (
          <li key={i} style={{ marginBottom: '8px' }}>{butir}</li>
        ))}
      </ol>

      <form onSubmit={kirim}>
        <label>Password baru (minimal 8 karakter)</label>
        <input type="password" required value={sandi} onChange={(e) => setSandi(e.target.value)} style={gayaInput} />
        <label>Ulangi password baru</label>
        <input type="password" required value={ulangi} onChange={(e) => setUlangi(e.target.value)} style={gayaInput} />

        <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', margin: '12px 0' }}>
          <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} style={{ marginTop: '4px' }} />
          <span>
            Saya telah membaca dan menyetujui tata tertib Ketua KPU, serta bersedia bertanggung jawab
            atas setiap tindakan yang tercatat atas nama saya.
          </span>
        </label>

        <button type="submit" disabled={loading || !setuju}>
          {loading ? 'Menyimpan...' : 'Setuju & Lanjutkan'}
        </button>
        {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}
      </form>
    </div>
  )
}
export default TataTertib