import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { labelJenis, labelStatus, formatWaktu } from './KelolaPemilih'

function PersetujuanPemilih() {
  const [usulan, setUsulan] = useState([])
  const [dipilih, setDipilih] = useState(new Set())
  const [sibuk, setSibuk] = useState(false)
  const [progres, setProgres] = useState('')

  async function muat() {
    const { data, error } = await supabase.rpc('daftar_usulan')
    if (error) window.alert(error.message)
    else setUsulan(data)
  }
  useEffect(() => { muat() }, [])

  async function putuskan(u, setuju) {
    const catatan = window.prompt(setuju ? 'Catatan persetujuan (boleh kosong):' : 'Alasan penolakan:')
    if (catatan === null) return
    const { data, error } = await supabase.rpc('putuskan_usulan', { p_id: u.id, p_setuju: setuju, p_catatan: catatan })
    if (error) window.alert(error.message)
    else if (data !== 'ok') window.alert(data)
    else {
      const baru = new Set(dipilih)
      baru.delete(u.id)
      setDipilih(baru)
      muat()
    }
  }

  async function putuskanMassal(setuju) {
    const daftar = menunggu.filter((u) => dipilih.has(u.id))
    if (daftar.length === 0) return
    const catatan = window.prompt(
      setuju
        ? `Setujui ${daftar.length} usulan yang dicentang?\nCatatan persetujuan (boleh kosong):`
        : `Tolak ${daftar.length} usulan yang dicentang?\nAlasan penolakan:`
    )
    if (catatan === null) return
    setSibuk(true)
    const gagal = []
    for (let i = 0; i < daftar.length; i++) {
      const u = daftar[i]
      setProgres(`Memproses ${i + 1} dari ${daftar.length}...`)
      const { data, error } = await supabase.rpc('putuskan_usulan', { p_id: u.id, p_setuju: setuju, p_catatan: catatan })
      if (error)
          return (
    <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'left' }}>
      <h2 style={{ textAlign: 'center' }}>Persetujuan Data Pemilih</h2>
      <h3>Menunggu persetujuan ({menunggu.length})</h3>
      {menunggu.length === 0 && <p>Tidak ada usulan yang menunggu.</p>}

      {menunggu.length > 0 && (
        <div className="kartu" style={{ padding: '12px 14px', marginBottom: '12px', position: 'sticky', top: '8px', zIndex: 5,
          display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', background: '#f5f3ff' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
            <input type="checkbox" checked={semuaDipilih} onChange={pilihSemua} disabled={sibuk}
              style={{ width: '20px', height: '20px' }} />
            Pilih Semua
          </label>
          <span style={{ fontSize: '14px', color: '#666' }}>{jumlahDipilih} dicentang</span>
          <span style={{ flex: 1 }} />
          <button onClick={() => putuskanMassal(true)} disabled={sibuk || jumlahDipilih === 0}
            style={{ background: '#16a34a' }}>✅ Setujui yang Dicentang</button>
          <button onClick={() => putuskanMassal(false)} disabled={sibuk || jumlahDipilih === 0}
            style={{ background: '#dc2626' }}>❌ Tolak yang Dicentang</button>
          {progres && <div style={{ width: '100%', fontSize: '14px' }}>⏳ {progres}</div>}
        </div>
      )}

      {menunggu.map((u) => (
        <div key={u.id} className="kartu" style={{ padding: '14px', marginBottom: '12px', display: 'flex', gap: '12px',
          alignItems: 'flex-start', outline: dipilih.has(u.id) ? '2px solid #4f46e5' : 'none' }}>
          <input type="checkbox" checked={dipilih.has(u.id)} onChange={() => centang(u.id)} disabled={sibuk}
            style={{ width: '20px', height: '20px', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <b>{labelJenis[u.jenis]} pemilih</b>
            {u.data_lama && <div style={{ fontSize: '14px', color: '#666' }}>Data lama: {u.data_lama}</div>}
            <div>{u.nomor_absen && `No. ${u.nomor_absen} · `}{u.nis} · <b>{u.nama}</b>{u.kelas && ` · ${u.kelas}`}</div>
            <div style={{ fontSize: '13px', color: '#666', margin: '4px 0 10px' }}>Diusulkan oleh {u.pengusul || '-'} · {formatWaktu(u.diusulkan_pada)}</div>
            <button onClick={() => putuskan(u, true)} disabled={sibuk} style={{ background: '#16a34a', marginRight: '8px' }}>✅ Setujui</button>
            <button onClick={() => putuskan(u, false)} disabled={sibuk} style={{ background: '#dc2626' }}>❌ Tolak</button>
          </div>
        </div>
      ))}

      <h3>Riwayat keputusan</h3>
      <div className="kartu">
        {riwayat.map((u) => (
          <div key={u.id} style={{ padding: '10px 14px', borderBottom: '1px solid #eee', fontSize: '14px' }}>
            <b>{labelStatus[u.status]}</b> · {labelJenis[u.jenis]} · {u.nis} – {u.nama} · oleh {u.pemutus || '-'} ({formatWaktu(u.diputuskan_pada)})
            {u.catatan && ` · ${u.catatan}`}
          </div>
        ))}
        {riwayat.length === 0 && <p style={{ padding: '14px' }}>Belum ada riwayat.</p>}
      </div>
    </div>
  )
}

export default PersetujuanPemilih