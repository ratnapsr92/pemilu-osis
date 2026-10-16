import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import UmpanBalikProker from './UmpanBalikProker'
import { jabatan } from './jabatan'

const warnaStatus = {
  'belum mulai': '#9ca3af',
  'berjalan': '#f59e0b',
  'selesai': '#16a34a',
  'batal': '#dc2626',
}

const gayaKartu = {
  border: '1px solid #ddd', borderRadius: '12px', padding: '16px',
  marginBottom: '12px', textAlign: 'left', background: '#fff'
}

function Batang({ persen, warna = '#4f46e5' }) {
  return (
    <div style={{ background: '#eee', borderRadius: '8px', height: '14px' }}>
      <div style={{ width: persen + '%', background: warna, height: '100%', borderRadius: '8px' }} />
    </div>
  )
}

function formatTanggal(t) {
  if (!t) return '-'
  return new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Proker({ siswa, onMasuk }) {
  const [organisasi, setOrganisasi] = useState([])
  const [aktif, setAktif] = useState(null)
  const [kepengurusan, setKepengurusan] = useState([])
  const [terbuka, setTerbuka] = useState(null)
  const [tampil, setTampil] = useState(null)
    const [ringkasan, setRingkasan] = useState({})
  const [saranPublik, setSaranPublik] = useState([])
  const [saranSaya, setSaranSaya] = useState([])

  async function muatUmpan() {
    const { data: r } = await supabase.rpc('ringkasan_proker')
    setRingkasan(Object.fromEntries((r || []).map((x) => [x.proker_id, x])))
    const { data: sp } = await supabase.rpc('saran_proker_publik')
    setSaranPublik(sp || [])
    if (siswa) {
      const { data: ss } = await supabase.rpc('saran_proker_saya')
      setSaranSaya(ss || [])
    } else setSaranSaya([])
  }

  useEffect(() => {
    muatUmpan()
  }, [siswa])

  useEffect(() => {
        supabase.from('pengaturan').select('proker_ditampilkan').eq('id', 1).single()
      .then(({ data }) => setTampil(data ? data.proker_ditampilkan : false))
    supabase.from('organisasi').select('*').order('urutan')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setOrganisasi(data)
          setAktif(data[0].id)
        }
      })

    // Ambil kepengurusan + data ketua + proker + riwayatnya sekaligus
    supabase.from('kepengurusan')
      .select('*, kandidat(*), proker(*, proker_update(*))')
      .order('id', { ascending: false })
      .then(({ data }) => {
        if (data) setKepengurusan(data)
      })
  }, [])

  // Kepengurusan terbaru untuk organisasi yang sedang dipilih
  const kp = kepengurusan.find((k) => k.organisasi_id === aktif)
    const j = jabatan(organisasi.find((o) => o.id === aktif)?.nama)
  const daftar = kp ? [...kp.proker].sort((a, b) => a.urutan - b.urutan || a.id - b.id) : []
  const dihitung = daftar.filter((p) => p.status !== 'batal')
  const jumlahSelesai = daftar.filter((p) => p.status === 'selesai').length
  const rataRata = dihitung.length > 0
    ? Math.round(dihitung.reduce((j, p) => j + p.progres, 0) / dihitung.length)
    : 0

    if (tampil === null) return <p>Memuat...</p>
  if (!tampil) {
    return (
      <div className="kartu" style={{ maxWidth: '520px', margin: '24px auto', padding: '28px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px' }}>📋</div>
        <h2 style={{ margin: '8px 0' }}>Program Kerja</h2>
        <p style={{ color: 'var(--teks-redup)' }}>
          Program kerja pengurus baru belum dipublikasikan. Halaman ini akan terisi setelah
          proker disusun dan dibuka oleh panitia.
        </p>
      </div>
    )
  }
    return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <h2>Tracker Program Kerja</h2>

      {/* Tab organisasi */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
        {organisasi.map((o) => (
          <button key={o.id} onClick={() => setAktif(o.id)}
            style={{
              padding: '10px 24px', fontSize: '16px', borderRadius: '999px',
              border: '2px solid #4f46e5',
              background: aktif === o.id ? '#4f46e5' : '#fff',
              color: aktif === o.id ? '#fff' : '#4f46e5',
            }}>
            {o.nama}
          </button>
        ))}
      </div>

      {!kp && <p>Kepengurusan belum ditetapkan.</p>}

      {kp && (
        <div>
          {/* Profil ketua terpilih */}
          <div style={{ ...gayaKartu, display: 'flex', gap: '16px', alignItems: 'center' }}>
            {kp.kandidat.foto_url && (
              <img src={kp.kandidat.foto_url} alt={kp.kandidat.nama_ketua}
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%' }} />
            )}
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{kp.kandidat.nama_ketua}</div>
              {kp.kandidat.nama_wakil && <div>{j.wakil}: {kp.kandidat.nama_wakil}</div>}
              <div style={{ color: '#666', fontSize: '14px' }}>
                Periode {formatTanggal(kp.mulai)} – {formatTanggal(kp.selesai)}
              </div>
            </div>
          </div>

          {/* Ringkasan */}
          <div style={gayaKartu}>
            <p style={{ margin: '0 0 8px' }}>
              <b>{jumlahSelesai}</b> dari <b>{daftar.length}</b> proker selesai · rata-rata progres <b>{rataRata}%</b>
            </p>
            <Batang persen={rataRata} />
          </div>

          {daftar.length === 0 && <p>Belum ada program kerja yang dimasukkan.</p>}

          {/* Daftar proker */}
          {daftar.map((p) => {
            const riwayat = [...p.proker_update].sort(
              (a, b) => new Date(b.dibuat_pada) - new Date(a.dibuat_pada)
            )
            return (
              <div key={p.id} style={gayaKartu}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'start' }}>
                  <b style={{ fontSize: '17px' }}>{p.judul}</b>
                  <span style={{
                    background: warnaStatus[p.status], color: '#fff', fontSize: '12px',
                    padding: '2px 10px', borderRadius: '999px', whiteSpace: 'nowrap'
                  }}>
                    {p.status}
                  </span>
                </div>

                {p.deskripsi && <p style={{ margin: '8px 0' }}>{p.deskripsi}</p>}
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
                  Target: {formatTanggal(p.target)} · Progres {p.progres}%
                </p>
                <Batang persen={p.progres} warna={warnaStatus[p.status]} />

                <UmpanBalikProker prokerId={p.id} ringkasan={ringkasan[p.id]}
                  saranPublik={saranPublik.filter((s) => s.proker_id === p.id)}
                  saranSaya={saranSaya.filter((s) => s.proker_id === p.id)}
                  siswa={siswa} onMasuk={onMasuk} onBerubah={muatUmpan} />

                {riwayat.length > 0 && (
                  <button onClick={() => setTerbuka(terbuka === p.id ? null : p.id)}
                    style={{ marginTop: '12px', fontSize: '14px' }}>
                    {terbuka === p.id ? 'Sembunyikan riwayat' : `Lihat riwayat (${riwayat.length})`}
                  </button>
                )}

                {terbuka === p.id && riwayat.map((u) => (
                  <div key={u.id} style={{ borderLeft: '3px solid #4f46e5', paddingLeft: '12px', marginTop: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {formatTanggal(u.dibuat_pada)}{u.progres !== null && ` · progres ${u.progres}%`}
                    </div>
                    <div style={{ whiteSpace: 'pre-line' }}>{u.catatan}</div>
                    {u.foto_url && (
                      <img src={u.foto_url} alt="Bukti kegiatan"
                        style={{ width: '100%', maxWidth: '360px', borderRadius: '8px', marginTop: '8px' }} />
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Proker