import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './Login'
import Admin from './Admin'
import Bilik from './Bilik'
import Kampanye from './Kampanye'
import Proker from './Proker'
import KelolaProker from './KelolaProker'

const gayaTombolKecil = { fontSize: '13px', opacity: 0.7, padding: '6px 12px' }

function App() {
  const [session, setSession] = useState(null)
  const [profil, setProfil] = useState(null)
  const [tampilLogin, setTampilLogin] = useState(false)
  const [beranda, setBeranda] = useState('kampanye')
  const [halaman, setHalaman] = useState(null)
  const [halamanAdmin, setHalamanAdmin] = useState('pemilu')

  // Cek apakah perangkat ini sudah login
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )
    return () => subscription.unsubscribe()
  }, [])

  // Halaman beranda yang dipilih panitia (kampanye / proker)
  useEffect(() => {
    supabase.from('pengaturan').select('beranda').eq('id', 1).single()
      .then(({ data }) => {
        if (data) setBeranda(data.beranda)
      })
  }, [])

  // Ambil profil (admin, bilik, atau pengurus)
  useEffect(() => {
    if (!session) {
      setProfil(null)
      return
    }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => setProfil(data))
  }, [session])

  const tampil = halaman ?? beranda

  const tombolKeluar = (
    <button onClick={() => supabase.auth.signOut()}
      style={{ padding: '10px 20px', marginTop: '24px' }}>
      Keluar
    </button>
  )

  return (
    <main style={{ textAlign: 'center', padding: '32px 16px' }}>
      <h1>{tampil === 'proker' && !session ? 'ORGANISASI SISWA UPT SMP NEGERI 2 SEMANDING' : 'PEMILU ORGANISASI SISWA UPT SMP NEGERI 2 SEMANDING'}</h1>

      {/* Pengunjung umum */}
      {!session && !tampilLogin && (
        <div>
          {tampil === 'proker' ? <Proker /> : <Kampanye />}

          <div style={{ marginTop: '48px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setHalaman(tampil === 'proker' ? 'kampanye' : 'proker')} style={gayaTombolKecil}>
              {tampil === 'proker' ? 'Lihat kampanye kandidat' : 'Lihat tracker proker'}
            </button>
            <button onClick={() => setTampilLogin(true)} style={gayaTombolKecil}>
              Masuk Panitia / Bilik / Pengurus
            </button>
          </div>
        </div>
      )}

      {/* Halaman login */}
      {!session && tampilLogin && (
        <div>
          <Login />
          <button onClick={() => setTampilLogin(false)}>← Kembali</button>
        </div>
      )}

      {/* Panitia (admin) */}
      {session && profil?.peran === 'admin' && (
        <div>
          <p>Halo, <b>{profil.nama}</b></p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
            <button onClick={() => setHalamanAdmin('pemilu')}
              style={{ padding: '8px 16px', fontWeight: halamanAdmin === 'pemilu' ? 'bold' : 'normal' }}>
              Dashboard Pemilu
            </button>
            <button onClick={() => setHalamanAdmin('proker')}
              style={{ padding: '8px 16px', fontWeight: halamanAdmin === 'proker' ? 'bold' : 'normal' }}>
              Kelola Proker
            </button>
          </div>
          {halamanAdmin === 'pemilu' ? <Admin /> : <KelolaProker />}
          {tombolKeluar}
        </div>
      )}

      {/* Pengurus OSIS / Dewan */}
      {session && profil?.peran === 'pengurus' && (
        <div>
          <p>Halo, <b>{profil.nama}</b></p>
          <KelolaProker organisasiId={profil.organisasi_id} />
          {tombolKeluar}
        </div>
      )}

      {/* Tablet bilik */}
      {session && profil?.peran === 'bilik' && <Bilik namaBilik={profil.nama} />}
    </main>
  )
}

export default App