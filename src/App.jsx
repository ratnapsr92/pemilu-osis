import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './Login'
import Kandidat from './Kandidat'
import Admin from './Admin'

function App() {
  const [session, setSession] = useState(null)
  const [profil, setProfil] = useState(null)
  const [votingDibuka, setVotingDibuka] = useState(false)

  // Cek apakah pengguna sudah login
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )
    return () => subscription.unsubscribe()
  }, [])

  // Ambil profil dan status voting setelah login
  useEffect(() => {
    if (!session) {
      setProfil(null)
      return
    }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => setProfil(data))

    supabase.from('pengaturan').select('voting_dibuka').eq('id', 1).single()
      .then(({ data }) => setVotingDibuka(data ? data.voting_dibuka : false))
  }, [session])

  return (
    <main style={{ textAlign: 'center', padding: '48px 16px' }}>
      <h1>PEMILU OSIS SMPN 2 SEMANDING</h1>

      {!session && <Login />}

      {session && profil && (
        <div>
          <p>Halo, <b>{profil.nama}</b> {profil.kelas && `(${profil.kelas})`}</p>

          {profil.peran === 'admin' ? (
            <Admin />
          ) : profil.sudah_memilih ? (
            <div>
              <h2>Terima kasih! ✅</h2>
              <p>Suara Anda sudah tercatat. Pilihan Anda dirahasiakan.</p>
            </div>
          ) : (
            <Kandidat
              dibuka={votingDibuka}
              onSelesai={() => setProfil({ ...profil, sudah_memilih: true })}
            />
          )}

          <button onClick={() => supabase.auth.signOut()}
            style={{ padding: '10px 20px', marginTop: '24px' }}>
            Keluar
          </button>
        </div>
      )}
    </main>
  )
}

export default App