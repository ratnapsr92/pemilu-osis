import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const gayaInput = { padding: '8px', fontSize: '15px', borderRadius: '8px', border: '1px solid #ccc' }

function BarisPetugas({ p, aktif, daftarBilik, onSimpan, onMuatUlang }) {
  const [nama, setNama] = useState(p.nama)
  const [bilikId, setBilikId] = useState(p.bilik_id ?? '')
  const [bukaPassword, setBukaPassword] = useState(false)
  const [passwordBaru, setPasswordBaru] = useState('')
  const [sibuk, setSibuk] = useState(false)

  async function gantiPassword() {
    if (passwordBaru.length < 8) {
      window.alert('Password minimal 8 karakter.')
      return
    }
    setSibuk(true)
    const { error } = await supabase.rpc('reset_password_petugas', { p_petugas: p.id, p_password: passwordBaru })
    setSibuk(false)
    if (error) window.alert(error.message)
    else {
      window.alert(`Password akun ${p.nis} sudah diganti.\nPassword baru: ${passwordBaru}\n\nBerikan kepada petugas yang bersangkutan.`)
      setPasswordBaru('')
      setBukaPassword(false)
    }
  }

  async function ubahAktif() {
    const tanya = aktif
      ? `Nonaktifkan akun ${p.nis}?\nPetugas ini tidak bisa login lagi dan dilepas dari biliknya.`
      : `Aktifkan kembali akun ${p.nis}?`
    if (!window.confirm(tanya)) return
    setSibuk(true)
    const { error } = await supabase.rpc('atur_aktif_petugas', { p_petugas: p.id, p_aktif: !aktif })
    setSibuk(false)
    if (error) window.alert(error.message)
    else onMuatUlang()
  }

  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid #eee', opacity: aktif ? 1 : 0.6 }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ minWidth: '110px', fontSize: '14px', color: '#666' }}>
          Login: <b>{p.nis}</b>{' '}
          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '999px',
            background: aktif ? '#dcfce7' : '#fee2e2', color: aktif ? '#166534' : '#991b1b' }}>
            {aktif ? 'Aktif' : 'Nonaktif'}
          </span>
        </span>
        <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama petugas"
          disabled={!aktif} style={{ ...gayaInput, flex: '1 1 160px' }} />
        <select value={bilikId} onChange={(e) => setBilikId(e.target.value)} disabled={!aktif} style={gayaInput}>
          <option value="">— belum ditugaskan —</option>
          {daftarBilik.map((b) => (
            <option key={b.bilik_id} value={b.bilik_id}>{b.nama_bilik}</option>
          ))}
        </select>
        <button onClick={() => onSimpan(p, nama, bilikId)} disabled={!aktif || sibuk}>Simpan</button>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        {aktif && (
          <button className="tombol-kedua" onClick={() => setBukaPassword(!bukaPassword)} disabled={sibuk}>
            🔑 Ganti Password
          </button>
        )}
        <button className="tombol-kedua" onClick={ubahAktif} disabled={sibuk}>
          {aktif ? '⛔ Nonaktifkan' : '✅ Aktifkan'}
        </button>
      </div>

      {bukaPassword && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
          <input type="text" value={passwordBaru} onChange={(e) => setPasswordBaru(e.target.value)}
            placeholder="Password baru (min. 8 karakter)" style={{ ...gayaInput, flex: '1 1 200px' }} />
          <button onClick={gantiPassword} disabled={sibuk}>Simpan Password</button>
        </div>
      )}
    </div>
  )
}
function FormAkunBaru({ onBerhasil }) {
  const [username, setUsername] = useState('')
  const [nama, setNama] = useState('')
  const [password, setPassword] = useState('')
  const [sibuk, setSibuk] = useState(false)

  async function buat(e) {
    e.preventDefault()
    setSibuk(true)
    const { error } = await supabase.rpc('buat_akun_petugas', {
      p_username: username, p_nama: nama, p_password: password,
    })
    setSibuk(false)
    if (error) {
      window.alert(error.message)
      return
    }
    window.alert(`Akun petugas berhasil dibuat.\n\nLogin: ${username.trim().toLowerCase()}\nPassword: ${password}\n\nCatat dan berikan kepada petugas. Lalu tentukan biliknya di daftar bawah.`)
    setUsername('')
    setNama('')
    setPassword('')
    onBerhasil()
  }

  return (
    <form onSubmit={buat} style={{ background: '#f5f3ff', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
      <b>➕ Buat Akun Petugas Baru</b>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username, mis. petugas4"
          required style={{ ...gayaInput, flex: '1 1 140px' }} />
        <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama asli petugas"
          required style={{ ...gayaInput, flex: '1 1 160px' }} />
        <input type="text" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min. 8 karakter)" required style={{ ...gayaInput, flex: '1 1 160px' }} />
        <button type="submit" disabled={sibuk}>{sibuk ? 'Membuat...' : 'Buat Akun'}</button>
      </div>
      <p style={{ fontSize: '13px', color: '#666', margin: '8px 0 0' }}>
        Username hanya huruf kecil dan angka, tanpa spasi. Petugas login dengan mengetik username ini saja.
      </p>
    </form>
  )
}

function PetugasBilik() {
  const [petugas, setPetugas] = useState([])
  const [statusAktif, setStatusAktif] = useState({})
  const [daftarBilik, setDaftarBilik] = useState([])
  const [pesan, setPesan] = useState('')

  async function muat() {
    const { data: a, error } = await supabase.rpc('daftar_petugas')
    if (error) {
      setPesan(error.message)
      return
    }
    setPesan('')
    setPetugas(a)
    const { data: b } = await supabase.rpc('daftar_bilik')
    if (b) setDaftarBilik(b)
    const { data: s } = await supabase.rpc('status_petugas')
    if (s) setStatusAktif(Object.fromEntries(s.map((x) => [x.id, x.aktif])))
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
        Buat akun petugas, isi nama aslinya, lalu tentukan bilik yang ditanganinya. Petugas hanya bisa memasukkan pemilih ke bilik miliknya.
      </p>

      <FormAkunBaru onBerhasil={muat} />

      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}

      {petugas.map((p) => {
        const aktif = statusAktif[p.id] ?? true
        return (
          <BarisPetugas key={`${p.id}-${p.nama}-${p.bilik_id ?? ''}-${aktif}`} p={p} aktif={aktif}
            daftarBilik={daftarBilik} onSimpan={simpan} onMuatUlang={muat} />
        )
      })}
      {petugas.length === 0 && !pesan && <p>Belum ada akun petugas.</p>}
    </section>
  )
}

export default PetugasBilik