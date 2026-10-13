import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { labelJenis, labelStatus, formatWaktu } from './KelolaPemilih'

function PersetujuanPemilih() {
  const [usulan, setUsulan] = useState([])

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
    else muat()
  }

  const menunggu = usulan.filter((u) => u.status === 'menunggu')
  const riwayat = usulan.filter((u) => u.status !== 'menunggu')

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'left' }}>
      <h2 style={{ textAlign: 'center' }}>Persetujuan Data Pemilih</h2>
      <h3>Menunggu persetujuan ({menunggu.length})</h3>
      {menunggu.length === 0 && <p>Tidak ada usulan yang menunggu.</p>}
      {menunggu.map((u) => (
        <div key={u.id} className="kartu" style={{ padding: '14px', marginBottom: '12px' }}>
          <b>{labelJenis[u.jenis]} pemilih</b>
          {u.data_lama && <div style={{ fontSize: '14px', color: '#666' }}>Data lama: {u.data_lama}</div>}
          <div>{u.nomor_absen && `No. ${u.nomor_absen} · `}{u.nis} · <b>{u.nama}</b>{u.kelas && ` · ${u.kelas}`}</div>
          <div style={{ fontSize: '13px', color: '#666', margin: '4px 0 10px' }}>Diusulkan oleh {u.pengusul || '-'} · {formatWaktu(u.diusulkan_pada)}</div>
          <button onClick={() => putuskan(u, true)} style={{ background: '#16a34a', marginRight: '8px' }}>✅ Setujui</button>
          <button onClick={() => putuskan(u, false)} style={{ background: '#dc2626' }}>❌ Tolak</button>
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