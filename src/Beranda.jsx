import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { daftarLogo } from './Kepala'

const formatJadwal = (iso) => new Date(iso).toLocaleString('id-ID', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
}) + ' WIB'

function Countdown({ sisa }) {
  const dua = (n) => String(n).padStart(2, '0')
  const bagian = [
    [Math.floor(sisa / 86400000), 'Hari'],
    [Math.floor((sisa % 86400000) / 3600000), 'Jam'],
    [Math.floor((sisa % 3600000) / 60000), 'Menit'],
    [Math.floor((sisa % 60000) / 1000), 'Detik'],
  ]
  return (
    <div className="countdown">
      {bagian.map(([angka, satuan]) => (
        <div key={satuan} className="kotak">
          <div className="angka">{dua(angka)}</div>
          <div className="satuan">{satuan}</div>
        </div>
      ))}
    </div>
  )
}

function Beranda({ onDetail, onHasil }) {
  const [atur, setAtur] = useState(null)
  const [organisasi, setOrganisasi] = useState([])
  const [sekarang, setSekarang] = useState(Date.now())

  useEffect(() => {
    supabase.from('pengaturan')
      .select('voting_dibuka, hasil_diumumkan, jadwal_mulai, jadwal_selesai').eq('id', 1).single()
      .then(({ data }) => {
        if (data) setAtur(data)
      })
    supabase.from('organisasi').select('*').order('urutan')
      .then(({ data }) => {
        if (data) setOrganisasi(data)
      })
    const timer = setInterval(() => setSekarang(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Tentukan isi banner sesuai keadaan pemilu
  let isiStatus = null
  if (atur) {
    const mulai = atur.jadwal_mulai ? new Date(atur.jadwal_mulai).getTime() : null
    const selesai = atur.jadwal_selesai ? new Date(atur.jadwal_selesai).getTime() : null

    if (atur.voting_dibuka) {
      isiStatus = <div className="status-pemilu hijau">🟢 Pemilu sedang berlangsung</div>
    } else if (atur.hasil_diumumkan) {
      isiStatus = (
        <div>
          <div className="status-pemilu">📢 Hasil pemilihan telah diumumkan</div>
          <div style={{ marginTop: '14px' }}>
            <button onClick={onHasil} style={{ background: '#f59e0b' }}>Lihat Hasil</button>
          </div>
        </div>
      )
    } else if (mulai && sekarang < mulai) {
      isiStatus = (
        <div>
          <Countdown sisa={mulai - sekarang} />
          <div className="jadwal-teks">{formatJadwal(atur.jadwal_mulai)}</div>
        </div>
      )
    } else if (selesai && sekarang > selesai) {
      isiStatus = <div className="status-pemilu">Pemungutan suara telah selesai · Menunggu pengumuman hasil</div>
    } else if (mulai) {
      isiStatus = <div className="status-pemilu">⏳ Pemilu segera dimulai</div>
    } else {
      isiStatus = <div className="status-pemilu">Jadwal pemilu akan segera diumumkan</div>
    }
  }

  return (
    <div>
      <section className="banner-besar">
        <div className="deret-logo">
          {daftarLogo.map((logo) => (
            <img key={logo.src} src={logo.src} alt={logo.alt}
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
          ))}
        </div>
        <div className="banner-label">Pilihan Langsung · Rahasia · Akuntabel</div>
        <h1>PEMILU ORGANISASI SISWA</h1>
        <p className="sub">UPT SMP Negeri 2 Semanding · Tahun Pelajaran 2026/2027</p>
        {isiStatus}
      </section>

      <div className="grid-poster">
        {organisasi.map((o) => (
          <article key={o.id} className="poster">
            {o.logo ? (
              <img src={o.logo} alt={`Logo ${o.nama}`}
                onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
            ) : (
              <div className="logo-kosong" />
            )}
            <div className="kecil">PEMILU</div>
            <h2>{o.nama.toUpperCase()}</h2>
            <button onClick={() => onDetail(o)}>Detail</button>
          </article>
        ))}
      </div>
    </div>
  )
}

export default Beranda