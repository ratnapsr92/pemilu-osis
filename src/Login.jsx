import { useState } from 'react'
import { supabase } from './supabase'

const DOMAIN = '@smpn2semanding.sch.id'

const gayaInput = {
  display: 'block', width: '100%', padding: '12px', marginBottom: '12px',
  fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box'
}

function Login() {
  const [nis, setNis] = useState('')
  const [password, setPassword] = useState('')
  const [pesan, setPesan] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setPesan('')

    const { error } = await supabase.auth.signInWithPassword({
        email: nis.trim().split('@')[0] + DOMAIN,
      password: password,
    })

    if (error) setPesan(error.message)
    setLoading(false)
  }

  return (
    <form onSubmit={handleLogin} style={{ maxWidth: '320px', margin: '24px auto' }}>
      <h2>Masuk</h2>
      <input style={gayaInput} placeholder="NIS" value={nis}
        onChange={(e) => setNis(e.target.value)} required />
      <input style={gayaInput} type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit" disabled={loading}
        style={{ padding: '12px 24px', fontSize: '16px', width: '100%' }}>
        {loading ? 'Memproses...' : 'Masuk'}
      </button>
      {pesan && <p style={{ color: 'crimson' }}>{pesan}</p>}
    </form>
  )
}

export default Login