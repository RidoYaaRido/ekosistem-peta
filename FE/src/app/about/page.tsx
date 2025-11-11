import React from 'react';
import Link from 'next/link';
import { MapPin, Recycle, Users, Leaf, Target, Sparkles, TrendingUp, Heart, ArrowRight, CheckCircle } from 'lucide-react';
import Header from '@/components/ui/Header';


export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <Header />

    <main className="pt-20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-6 font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Transformasi Digital untuk Lingkungan Berkelanjutan</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Tentang <span className="text-green-600">ECO PETA</span>
          </h1>
          
          <p className="text-xl text-gray-600 leading-relaxed">
            Platform pemetaan digital yang menghubungkan masyarakat dengan ekosistem daur ulang di Bekasi, 
            mewujudkan lingkungan yang lebih bersih dan berkelanjutan melalui teknologi.
          </p>
        </div>
      </section>

      {/* Main Info Cards */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-green-600 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Pemetaan Digital</h3>
            <p className="text-gray-600 leading-relaxed">
              Teknologi pemetaan interaktif yang menampilkan lokasi Bank Sampah, pengepul, dan tempat daur ulang di seluruh wilayah Bekasi secara real-time.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-blue-600 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Recycle className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Ekosistem Daur Ulang</h3>
            <p className="text-gray-600 leading-relaxed">
              Menghubungkan rumah tangga, bank sampah, pengepul, dan industri daur ulang dalam satu platform terintegrasi untuk pengelolaan limbah yang efisien.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-t-4 border-purple-600 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Komunitas Peduli</h3>
            <p className="text-gray-600 leading-relaxed">
              Membangun komunitas masyarakat yang sadar lingkungan dengan sistem reward dan gamifikasi untuk mendorong partisipasi aktif dalam daur ulang.
            </p>
          </div>
        </div>
      </section>

      {/* Transformation Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 py-16 my-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Transformasi Digital
              </h2>
              <p className="text-green-100 text-lg">
                Mengubah cara masyarakat menemukan dan mengakses layanan daur ulang
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Before */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl">❌</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Sebelumnya</h3>
                    <p className="text-green-50 text-sm">Cara konvensional yang tidak efisien</p>
                  </div>
                </div>
                <ul className="space-y-3 text-green-50">
                  <li className="flex items-start gap-2">
                    <span className="text-red-300 mt-1">•</span>
                    <span>Pencarian manual dari rumah ke rumah</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-300 mt-1">•</span>
                    <span>Informasi dari mulut ke mulut yang tidak akurat</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-300 mt-1">•</span>
                    <span>Tidak ada transparansi harga dan layanan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-300 mt-1">•</span>
                    <span>Sulit menemukan bank sampah terdekat</span>
                  </li>
                </ul>
              </div>

              {/* After */}
              <div className="bg-white rounded-2xl p-8 shadow-2xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Dengan Eco-Peta</h3>
                    <p className="text-gray-600 text-sm">Solusi digital yang mudah dan cepat</p>
                  </div>
                </div>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Peta digital interaktif dengan lokasi real-time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Informasi lengkap dan terverifikasi</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Transparansi harga dan jenis layanan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Navigasi langsung ke lokasi terdekat</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability Aspect */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4 font-medium">
              <Leaf className="w-4 h-4" />
              <span>Aspek Keberlanjutan</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Dampak untuk Lingkungan
            </h2>
            <p className="text-gray-600 text-lg">
              Kontribusi nyata Eco-Peta untuk masa depan yang lebih hijau
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Impact Card 1 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Mengurangi Sampah TPA
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Dengan mempermudah akses ke layanan daur ulang, Eco-Peta membantu mengalihkan sampah dari Tempat Pembuangan Akhir (TPA) ke jalur daur ulang yang produktif.
              </p>
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <TrendingUp className="w-5 h-5" />
                <span>Meningkatkan tingkat daur ulang rumah tangga</span>
              </div>
            </div>

            {/* Impact Card 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Pemberdayaan Masyarakat
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Platform ini mendorong partisipasi aktif masyarakat dalam praktik ramah lingkungan, menciptakan kebiasaan berkelanjutan di tingkat rumah tangga.
              </p>
              <div className="flex items-center gap-2 text-blue-700 font-semibold">
                <Users className="w-5 h-5" />
                <span>Membangun komunitas peduli lingkungan</span>
              </div>
            </div>

            {/* Impact Card 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Recycle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ekonomi Sirkular
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Menghubungkan semua pemangku kepentingan dalam rantai daur ulang, dari rumah tangga hingga industri, menciptakan ekosistem ekonomi yang berkelanjutan.
              </p>
              <div className="flex items-center gap-2 text-purple-700 font-semibold">
                <TrendingUp className="w-5 h-5" />
                <span>Meningkatkan nilai ekonomi sampah</span>
              </div>
            </div>

            {/* Impact Card 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8">
              <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mb-6">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Jejak Karbon Rendah
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Dengan memetakan lokasi terdekat, platform ini mengurangi jarak tempuh dan emisi karbon dari aktivitas pengangkutan sampah daur ulang.
              </p>
              <div className="flex items-center gap-2 text-orange-700 font-semibold">
                <Leaf className="w-5 h-5" />
                <span>Efisiensi logistik dan transportasi</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Info */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Informasi Karya
              </h2>
              <div className="w-24 h-1 bg-green-600 mx-auto rounded-full"></div>
            </div>

            <div className="space-y-6">
              {/* Judul Karya */}
              <div className="border-l-4 border-green-600 pl-6 py-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Judul Karya
                </h3>
                <p className="text-2xl font-bold text-gray-900">ECO PETA</p>
              </div>

              {/* Penjelasan */}
              <div className="border-l-4 border-blue-600 pl-6 py-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Deskripsi
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Sebuah situs web berbasis peta interaktif yang memetakan lokasi Bank Sampah, 
                  pengepul barang bekas, dan tempat daur ulang di wilayah Bekasi. Platform ini 
                  mengintegrasikan teknologi geolokasi dengan sistem informasi terintegrasi untuk 
                  memberikan akses mudah kepada masyarakat dalam menemukan layanan pengelolaan 
                  sampah daur ulang.
                </p>
              </div>

              {/* Transformasi Digital */}
              <div className="border-l-4 border-purple-600 pl-6 py-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Transformasi Digital
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Mengubah proses pencarian manual atau informasi dari mulut ke mulut untuk menemukan 
                  tempat menyetor sampah daur ulang menjadi sistem digital yang terstruktur, akurat, 
                  dan mudah diakses melalui perangkat mobile maupun desktop.
                </p>
              </div>

              {/* Aspek Berkelanjutan */}
              <div className="border-l-4 border-orange-600 pl-6 py-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Aspek Berkelanjutan
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Mendorong dan mempermudah praktik daur ulang di tingkat rumah tangga, mengurangi 
                  volume sampah yang berakhir di TPA (Tempat Pembuangan Akhir), serta berkontribusi 
                  pada keberlanjutan lingkungan dengan menciptakan ekosistem ekonomi sirkular yang 
                  memberdayakan komunitas lokal.
                </p>
              </div>

              {/* Target Wilayah */}
              <div className="border-l-4 border-green-600 pl-6 py-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Target Wilayah
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Kota Bekasi, Jawa Barat, dengan rencana ekspansi ke wilayah Jabodetabek dan 
                  kota-kota besar lainnya di Indonesia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-green-600 to-green-700 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Siap Berkontribusi untuk Lingkungan?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Bergabunglah dengan ribuan masyarakat Bekasi yang telah berkomitmen untuk masa depan yang lebih hijau
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-600 rounded-xl hover:bg-green-50 font-bold text-lg transition-colors shadow-lg"
            >
              Mulai Sekarang
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-700 text-white rounded-xl hover:bg-green-800 font-bold text-lg transition-colors border-2 border-white/30"
            >
              Pelajari Cara Kerja
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">Eco-Peta</span>
              </div>
              <p className="text-gray-400 text-sm">
                Platform digital untuk pengelolaan sampah daur ulang berbasis komunitas.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Navigasi</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/" className="hover:text-green-400">Beranda</Link></li>
                <li><Link href="/about" className="hover:text-green-400">Tentang</Link></li>
                <li><Link href="/how-it-works" className="hover:text-green-400">Cara Kerja</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Layanan</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/register" className="hover:text-green-400">Daftar</Link></li>
                <li><Link href="/login" className="hover:text-green-400">Masuk</Link></li>
                <li><Link href="/dashboard" className="hover:text-green-400">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Email: info@eco-peta.id</li>
                <li>Wilayah: Bekasi, Jawa Barat</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 Eco-Peta. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
      </main>
    </div>
  );
}