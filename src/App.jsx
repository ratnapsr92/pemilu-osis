import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './Login'
import MasukBilik from './MasukBilik'
import Admin from './Admin'
import Bilik from './Bilik'
import Beranda from './Beranda'
import DetailOrganisasi from './DetailOrganisasi'
import Proker from './Proker'
import Hasil from './Hasil'
import KelolaProker from './KelolaProker'
import KelolaKandidat from './KelolaKandidat'
import KelolaBilik from './KelolaBilik'
import { Navbar, Hero } from './Kepala'

const daftarHero = {
  proker: {
    label: 'Transparansi Program Kerja',
    judul: 'Janji Kampanye, Kini Bisa Dipantau',
    teks: 'Pantau progres program kerja pengurus OSIS dan Dewan UPT SMP Negeri 2 Semanding selama satu tahun.',
  },
  hasil: {
    label: 'Hasil Resmi Pemilihan',
    judul: 'Inilah Pilihan Siswa',
    teks: 'Hasil pemilihan Ketua OSIS dan Dewan UPT SMP Negeri 2 Semanding Tahun Pelajaran 2026/2027.',
  },
}

const menuAdmin = [
  { id: 'pemilu', label: 'Pemilu' },
  { id: 'kandidat', label: 'Kandidat' },
  { id: 'bilik', label: 'Bilik' },
  { id: 'proker', label: 'Proker' },
]

function Kaki() {
  return (
    <footer className="footer">
      <b>PILANG</b> · Pilihan Langsung — UPT SMP Negeri 2 Semanding
      <br />
      Tubernova Award 2026
    </footer>
  )
}
function App() {
  const [session, setSession] = useState(null)
  const [akun, setAkun] = useState({ profil: null, bilik: null })
  const [ulang, setUlang] = useState(0)
  const [beranda, setBeranda] = useState('kampanye')
  const [hasilDiumumkan, setHasilDiumumkan] = useState(false)
  const [halaman, setHalaman] = useState(null)
  const [orgDetail, setOrgDetail] = useState(null)
  const [halamanAdmin, setHalamanAdmin] = useState('pemilu')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    supabase.from('pengaturan').select('beranda, hasil_diumumkan').eq('id', 1).single()
      .then(({ data }) => {
        if (data) {
          setBeranda(data.beranda)
          setHasilDiumumkan(data.hasil_diumumkan)
        }
      })
  }, [])

  useEffect(() => {
    if (!session) {
      setAkun({ profil: null, bilik: null })
      return
    }
    let batal = false
    async function muat() {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (p) {
        if (!batal) setAkun({ profil: p, bilik: null })
        return
      }
      const { data: b } = await supabase.rpc('giliran_saya')
      if (!batal) setAkun({ profil: null, bilik: b && b.length > 0 ? b[0].nama_bilik : null })
    }
    muat()
    return () => { batal = true }
  }, [session, ulang])

  function keluar() {
    supabase.auth.signOut()
    setHalaman(null)
  }

  function bukaDetail(org) {
    setOrgDetail(org)
    setHalaman('organisasi')
    window.scrollTo(0, 0)
  }

  const tombolKeluar = <button className="tombol-kedua" onClick={keluar}>Keluar</button>
  const profil = akun.profil

  // Tablet bilik
  if (session && akun.bilik) {
    return (
      <>
        <Navbar />
        <main className="wadah" style={{ paddingTop: '24px' }}>
          <Bilik namaBilik={akun.bilik} onTerlepas={() => supabase.auth.signOut()} />
        </main>
      </>
    )
  }

  // Admin
  if (session && profil?.peran === 'admin') {
    return (
      <>
        <Navbar menu={menuAdmin} aktif={halamanAdmin} onPilih={setHalamanAdmin} kanan={tombolKeluar} />
        <main className="wadah" style={{ paddingTop: '24px' }}>
          <p className="sapaan">Halo, <b>{profil.nama}</b></p>
          {halamanAdmin === 'pemilu' && <Admin />}
          {halamanAdmin === 'kandidat' && <KelolaKandidat />}
          {halamanAdmin === 'bilik' && <KelolaBilik />}
          {halamanAdmin === 'proker' && <KelolaProker />}
        </main>
        <Kaki />
      </>
    )
  }

  // Pengurus OSIS / Dewan
  if (session && profil?.peran === 'pengurus') {
    return (
      <>
        <Navbar kanan={tombolKeluar} />
        <main className="wadah" style={{ paddingTop: '24px' }}>
          <p className="sapaan">Halo, <b>{profil.nama}</b></p>
          <KelolaProker organisasiId={profil.organisasi_id} />
        </main>
        <Kaki />
      </>
    )
  }

  // Pengunjung umum
  const menuPublik = [
    { id: 'kampanye', label: 'Beranda' },
    ...(hasilDiumumkan ? [{ id: 'hasil', label: 'Hasil' }] : []),
    { id: 'proker', label: 'Proker' },
    { id: 'masuk', label: 'Masuk' },
  ]
  const aktif = halaman ?? beranda
  const menuAktif = aktif === 'organisasi' ? 'kampanye' : aktif

  return (
    <>
      <Navbar menu={menuPublik} aktif={menuAktif} onPilih={setHalaman} />
      <main className="wadah">
        {aktif === 'masuk' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', paddingTop: '16px' }}>
            <div style={{ flex: '1 1 300px', maxWidth: '380px' }}>
              <Login />
            </div>
            <div style={{ flex: '1 1 300px', maxWidth: '380px' }}>
              <MasukBilik onBerhasil={() => setUlang((u) => u + 1)} />
            </div>
          </div>
        )}

        {aktif === 'kampanye' && (
          <Beranda onDetail={bukaDetail} onHasil={() => setHalaman('hasil')} />
        )}

        {aktif === 'organisasi' && orgDetail && (
          <DetailOrganisasi key={orgDetail.id} org={orgDetail} onKembali={() => setHalaman('kampanye')} />
        )}

        {aktif === 'hasil' && (
          <>
            <Hero {...daftarHero.hasil} />
            <Hasil />
          </>
        )}

        {aktif === 'proker' && (
          <>
            <Hero {...daftarHero.proker} />
            <Proker />
          </>
        )}
      </main>
      <Kaki />
    </>
  )
}

export default App