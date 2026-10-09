import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './Login'
import Admin from './Admin'
import Bilik from './Bilik'
import Kampanye from './Kampanye'
import Proker from './Proker'
import KelolaProker from './KelolaProker'
import Kepala from './Kepala'

function App() {
  const [session, setSession] = useState(null)
  const [profil, setProfil] = useState(null)
  const [tampilLogin, setTampilLogin] = useState(false)
  const [beranda, setBeranda] = useState('kampanye')
  const [halaman, setHalaman] = useState(null)
  const [halamanAdmin, setHalamanAdmin] = useState('pemilu')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
        supabase.from('pengaturan').select('beranda').eq('id', 1).single()
      .then(({ data }) => {
        if (data) setBeranda(data.beranda)
      })
  }, [])

  useEffect(() => {
    if (!session) {
      setProfil(null)
      return
    }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => setProfil(data))
  }, [session])
        const tampil = halaman ?? beranda
  const subjudul = tampil === 'proker' && !session
    ? 'Organisasi Siswa UPT SMP Negeri 2 Semanding'
    : 'Pemilu Organisasi Siswa UPT SMP Negeri 2 Semanding'

  const tombolKeluar = (
    <button className="tombol-kedua" onClick={() => supabase.auth.signOut()} style={{ marginTop: '24px' }}>
      Keluar
    </button>
  )

  return (
    <main style={{ textAlign: 'center', padding: '28px 16px' }}>
      <Kepala subjudul={subjudul} />

      {!session && !tampilLogin && (
        <div>
          {tampil === 'proker' ? <Proker /> : <Kampanye />}
          <div style={{ marginTop: '48px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="tombol-kedua" onClick={() => setHalaman(tampil === 'proker' ? 'kampanye' : 'proker')}>
              {tampil === 'proker' ? 'Lihat kampanye kandidat' : 'Lihat tracker proker'}
            </button>
            <button className="tombol-kedua" onClick={() => setTampilLogin(true)}>
              Masuk Panitia / Bilik / Pengurus
            </button>
          </div>
        </div>
      )}

      {!session && tampilLogin && (
        <div>
          <Login />
          <button className="tombol-kedua" onClick={() => setTampilLogin(false)}>← Kembali</button>
        </div>
      )}
            {session && profil?.peran === 'admin' && (
        <div>
          <p>Halo, <b>{profil.nama}</b></p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button className={halamanAdmin === 'pemilu' ? '' : 'tombol-kedua'} onClick={() => setHalamanAdmin('pemilu')}>
              Dashboard Pemilu
            </button>
            <button className={halamanAdmin === 'proker' ? '' : 'tombol-kedua'} onClick={() => setHalamanAdmin('proker')}>
              Kelola Proker
            </button>
          </div>
          {halamanAdmin === 'pemilu' ? <Admin /> : <KelolaProker />}
          {tombolKeluar}
        </div>
      )}

      {session && profil?.peran === 'pengurus' && (
        <div>
          <p>Halo, <b>{profil.nama}</b></p>
          <KelolaProker organisasiId={profil.organisasi_id} />
          {tombolKeluar}
        </div>
      )}

      {session && profil?.peran === 'bilik' && <Bilik namaBilik={profil.nama} />}

      <footer className="kaki">
        PILANG · UPT SMP Negeri 2 Semanding · Tubernova Award 2026
      </footer>
    </main>
  )
}

export default App