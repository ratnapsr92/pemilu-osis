import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './Login'
import Admin from './Admin'
import Bilik from './Bilik'
import Kampanye from './Kampanye'

function App() {
  const [session, setSession] = useState(null)
  const [profil, setProfil] = useState(null)
  const [tampilLogin, setTampilLogin] = useState(false)

  // Cek apakah perangkat ini sudah login
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )
    return () => subscription.unsubscribe()
  }, [])

  // Ambil profil (admin atau bilik)
  useEffect(() => {
    if (!session) {
      setProfil(null)
      return
    }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => setProfil(data))
  }, [session])

  return (
    <main style={{ textAlign: 'center', padding: '32px 16px' }}>
      <h1>PEMILU OSIS SMPN 2 SEMANDING</h1>

      {/* Pengunjung umum: halaman kampanye */}
      {!session && !tampilLogin && (
        <div>
          <Kampanye />
          <button onClick={() => setTampilLogin(true)}
            style={{ marginTop: '48px', fontSize: '13px', opacity: 0.6 }}>
            Masuk Panitia / Bilik
          </button>
        </div>
      )}

      {/* Halaman login panitia/bilik */}
      {!session && tampilLogin && (
        <div>
          <Login />
          <button onClick={() => setTampilLogin(false)}>← Kembali ke kampanye</button>
        </div>
      )}

      {/* Panitia */}
      {session && profil?.peran === 'admin' && (
        <div>
          <p>Halo, <b>{profil.nama}</b></p>
          <Admin />
          <button onClick={() => supabase.auth.signOut()}
            style={{ padding: '10px 20px', marginTop: '24px' }}>
            Keluar
          </button>
        </div>
      )}

      {/* Tablet bilik */}
      {session && profil?.peran === 'bilik' && <Bilik namaBilik={profil.nama} />}
    </main>
  )
}

export default App