import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './Login'
import MasukBilik from './MasukBilik'
import MasukSiswa from './MasukSiswa'
import HalamanMasuk from './HalamanMasuk'
import Admin from './Admin'
import Bilik from './Bilik'
import Beranda from './Beranda'
import DetailOrganisasi from './DetailOrganisasi'
import Proker from './Proker'
import Hasil from './Hasil'
import KelolaProker from './KelolaProker'
import KelolaKandidat from './KelolaKandidat'
import KelolaBilik from './KelolaBilik'
import MejaBilik from './MejaBilik'
import PetugasBilik from './PetugasBilik'
import ModerasiKomentar from './ModerasiKomentar'
import ModerasiSaranProker from './ModerasiSaranProker'
import TataTertib from './TataTertib'
import Integritas from './Integritas'
import LogAktivitas from './LogAktivitas'
import ResetData from './ResetData'
import KoreksiMemilih from './KoreksiMemilih'
import KelolaPemilih from './KelolaPemilih'
import PersetujuanPemilih from './PersetujuanPemilih'
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
  { id: 'pemilih', label: 'Pemilih' },
  { id: 'bilik', label: 'Bilik' },
  { id: 'proker', label: 'Proker' },
  { id: 'komentar', label: 'Komentar' },
  { id: 'log', label: 'Log' },
]

const menuKpu = [
  { id: 'pengawasan', label: 'Pengawasan' },
  { id: 'persetujuan', label: 'Persetujuan' },
  { id: 'keamanan', label: 'Keamanan' },
]

function Kaki() {
  return (
    <footer className="footer">
      <b>PILANG</b> · Pilihan Langsung — UPT SMP Negeri 2 Semanding
      <br />
      Tubernova Award 2026
              <br />
        <a href="/panduan.pdf" target="_blank" rel="noreferrer">📘 Buku Panduan PILANG</a>
    </footer>
  )
}

// Menu Keamanan Ketua KPU (setiap kali dibuka, tercatat di log)
function HalamanKeamanan() {
  useEffect(() => {
    supabase.rpc('catat_akses_keamanan').then(() => {})
  }, [])
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Keamanan</h2>
          <KoreksiMemilih />
      <ResetData onSelesai={() => {}} />
    </div>
  )
}
function App() {
  const [session, setSession] = useState(null)
  const [akun, setAkun] = useState({ profil: null, bilik: null, siswa: null })
  const [ulang, setUlang] = useState(0)
  const [beranda, setBeranda] = useState('kampanye')
  const [hasilDiumumkan, setHasilDiumumkan] = useState(false)
  const [halaman, setHalaman] = useState(null)
  const [orgDetail, setOrgDetail] = useState(null)
  const [halamanAdmin, setHalamanAdmin] = useState('pemilu')
  const [halamanKpu, setHalamanKpu] = useState('pengawasan')

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

  // Kenali jenis akun: admin/KPU/pengurus/petugas (profil), tablet bilik, atau siswa
  useEffect(() => {
    if (!session) {
      setAkun({ profil: null, bilik: null, siswa: null })
      return
    }
    let batal = false
    async function muat() {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (p) {
        if (!batal) setAkun({ profil: p, bilik: null, siswa: null })
        return
      }
      const { data: b } = await supabase.rpc('giliran_saya')
      if (b && b.length > 0) {
        if (!batal) setAkun({ profil: null, bilik: b[0].nama_bilik, siswa: null })
        return
      }
      const { data: s } = await supabase.rpc('info_siswa')
      if (!batal) setAkun({ profil: null, bilik: null, siswa: s && s.length > 0 ? s[0] : null })
    }
    muat()
    return () => { batal = true }
  }, [session, ulang])
    function keluar() {
    supabase.auth.signOut()
    setHalaman(null)
  }

  async function keluarSiswa() {
    await supabase.rpc('keluar_siswa')
    await supabase.auth.signOut()
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

  // Petugas bilik (admin OSIS)
  if (session && profil?.peran === 'petugas') {
    return (
      <>
        <Navbar kanan={tombolKeluar} />
        <main className="wadah" style={{ paddingTop: '24px' }}>
          <p className="sapaan">Halo, <b>{profil.nama}</b> · Petugas Bilik</p>
          <MejaBilik />
        </main>
        <Kaki />
      </>
    )
  }
    // Ketua KPU
  if (session && profil?.peran === 'kpu') {
    if (!profil.tatib_disetujui_pada) {
      return (
        <>
          <Navbar kanan={tombolKeluar} />
          <main className="wadah" style={{ paddingTop: '24px' }}>
            <TataTertib nama={profil.nama} onSelesai={() => setUlang((u) => u + 1)} />
          </main>
          <Kaki />
        </>
      )
    }
    return (
      <>
        <Navbar menu={menuKpu} aktif={halamanKpu} onPilih={setHalamanKpu} kanan={tombolKeluar} />
        <main className="wadah" style={{ paddingTop: '24px' }}>
          <p className="sapaan">Halo, <b>{profil.nama}</b> · Ketua KPU</p>
          {halamanKpu === 'pengawasan' && (
            <div style={{ maxWidth: '760px', margin: '0 auto' }}>
              <Integritas />
              <LogAktivitas />
            </div>
          )}
          {halamanKpu === 'persetujuan' && <PersetujuanPemilih />}
          {halamanKpu === 'keamanan' && <HalamanKeamanan />}
        </main>
        <Kaki />
      </>
    )
  }

  // Admin guru
  if (session && profil?.peran === 'admin') {
    return (
      <>
        <Navbar menu={menuAdmin} aktif={halamanAdmin} onPilih={setHalamanAdmin} kanan={tombolKeluar} />
        <main className="wadah" style={{ paddingTop: '24px' }}>
          <p className="sapaan">Halo, <b>{profil.nama}</b></p>
          {halamanAdmin === 'pemilu' && <Admin />}
          {halamanAdmin === 'kandidat' && <KelolaKandidat />}
          {halamanAdmin === 'pemilih' && <KelolaPemilih />}
          {halamanAdmin === 'bilik' && <KelolaBilik />}
          {halamanAdmin === 'bilik' && <PetugasBilik />}
          {halamanAdmin === 'proker' && <KelolaProker />}
          {halamanAdmin === 'komentar' && <ModerasiKomentar />}
                    {halamanAdmin === 'komentar' && <ModerasiSaranProker />}
          {halamanAdmin === 'log' && <LogAktivitas />}
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
    // Pengunjung umum & siswa yang sudah login
  const siswa = akun.siswa
  const menuPublik = [
    { id: 'kampanye', label: 'Beranda' },
    ...(hasilDiumumkan ? [{ id: 'hasil', label: 'Hasil' }] : []),
    { id: 'proker', label: 'Proker' },
    ...(siswa ? [] : [{ id: 'masuk', label: 'Masuk' }]),
  ]
  const aktif = halaman ?? beranda
  const menuAktif = aktif === 'organisasi' ? 'kampanye' : aktif
  const kananSiswa = siswa ? (
    <>
      <span className="sapaan-nav">Hai, {siswa.nama.split(' ')[0]}</span>
      <button className="tombol-kedua" onClick={keluarSiswa}>Keluar</button>
    </>
  ) : null

  return (
    <>
      <Navbar menu={menuPublik} aktif={menuAktif} onPilih={setHalaman} kanan={kananSiswa} />
      <main className="wadah">
        {aktif === 'masuk' && !siswa && (
          <HalamanMasuk
            onSiswaBerhasil={() => { setUlang((u) => u + 1); setHalaman(null) }}
            onBilikBerhasil={() => setUlang((u) => u + 1)}
          />
        )}
          

        {aktif === 'kampanye' && <Beranda onDetail={bukaDetail} onHasil={() => setHalaman('hasil')} />}

        {aktif === 'organisasi' && orgDetail && (
          <DetailOrganisasi key={orgDetail.id} org={orgDetail} siswa={siswa}
            onMasuk={() => setHalaman('masuk')} onKembali={() => setHalaman('kampanye')} />
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
            <Proker siswa={siswa} onMasuk={() => setHalaman('masuk')} />
          </>
        )}
      </main>
      <Kaki />
    </>
  )
}

export default App