import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const FILE_MASUK = 'data/pemilih.csv'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// 1. Baca file CSV (pemisah koma atau titik koma)
const isi = readFileSync(FILE_MASUK, 'utf8').replace(/^\uFEFF/, '')
const baris = isi.split(/\r?\n/).filter((b) => b.trim() !== '')
const pemisah = baris[0].includes(';') ? ';' : ','

// 2. Ubah menjadi data, buang baris kosong & NIS dobel
const unik = new Map()
for (const b of baris.slice(1)) {
  const [nis, nama, kelas] = b.split(pemisah).map((x) => (x ?? '').trim())
  if (!nis || !nama) {
    console.log('⚠️  Baris dilewati (NIS/nama kosong):', b)
    continue
  }
  if (unik.has(nis)) console.log(`⚠️  NIS ${nis} muncul lebih dari sekali, dipakai yang terakhir`)
  unik.set(nis, { nis, nama, kelas: kelas || null })
}
const daftar = [...unik.values()]

// 3. Simpan ke database (NIS yang sudah ada akan diperbarui namanya/kelasnya)
const { error } = await supabase.from('pemilih').upsert(daftar, { onConflict: 'nis' })

if (error) console.log('❌ Gagal:', error.message)
else console.log(`✅ ${daftar.length} pemilih tersimpan.`)