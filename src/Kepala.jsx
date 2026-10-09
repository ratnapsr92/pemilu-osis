// Logo PILANG: kotak suara dengan kertas suara bercentang
export function LogoPilang() {
  return (
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#4f46e5" />
      <rect x="14" y="30" width="36" height="22" rx="4" fill="#ffffff" />
      <rect x="24" y="10" width="16" height="22" rx="3" fill="#f59e0b" />
      <path d="M28 21l3 3 6-7" stroke="#ffffff" strokeWidth="3" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      <rect x="21" y="28" width="22" height="4" rx="2" fill="#312e81" />
    </svg>
  )
}

// Logo instansi (file ada di folder public/logo)
const daftarLogo = [
  { src: '/logo/kabupaten.png', alt: 'Logo Kabupaten Tuban' },
  { src: '/logo/sekolah.png', alt: 'Logo UPT SMP Negeri 2 Semanding' },
  { src: '/logo/osis.png', alt: 'Logo OSIS' },
  { src: '/logo/dewan.png', alt: 'Logo Dewan' },
]

function Kepala({ subjudul }) {
  return (
    <header className="kepala">
      <div className="deret-logo">
        {daftarLogo.map((logo) => (
          <img key={logo.src} src={logo.src} alt={logo.alt}
            onError={(e) => { e.currentTarget.style.display = 'none' }} />
        ))}
      </div>

      <div className="merek">
        <LogoPilang />
        <div>
          <div className="merek-nama">PILANG</div>
          <div className="merek-tagline">Pilihan Langsung · Rahasia, Nirkertas, Akuntabel</div>
        </div>
      </div>

      <div className="kepala-sekolah">{subjudul}</div>
    </header>
  )
}

export default Kepala