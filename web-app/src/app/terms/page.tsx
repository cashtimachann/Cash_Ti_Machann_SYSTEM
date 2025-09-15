import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-primary-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Cash Ti <span className="text-primary-600">Machann</span>
          </h1>
          <h2 className="text-2xl text-gray-300">Kondisyon ak Règleman</h2>
        </div>

        {/* Terms Content */}
        <div className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-xl border border-primary-600/20 text-gray-300">
          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-semibold text-white mb-3">1. Akseptasyon Kondisyon yo</h3>
              <p>
                Lè ou kreye yon kont sou Cash Ti Machann, ou aksepte tout kondisyon ak règleman yo ki nan dokiman sa a. 
                Si ou pa dakò ak kondisyon yo, pa itilize sèvis la.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">2. Sekirite Kont</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Ou responsab sekirite mo de pas ou an</li>
                <li>Pa kominike enfòmasyon kont ou yo ak okenn moun</li>
                <li>Rapòte nenpòt aktivite ki sanble sispè yo imedyatman</li>
                <li>Nou rekòmande ou chanje mo de pas ou an regilyèman</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">3. Sèvis Finansye</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cash Ti Machann se yon platfòm pou tranzaksyon finansye yo</li>
                <li>Nou responsab nan sekirite ak pwoteksyon lajan ou an</li>
                <li>Frè yo ka aplike pou sèten tranzaksyon yo</li>
                <li>Nou gen dwa limite oswa sipann sèten tranzaksyon yo pou sekirite</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">4. Itilizasyon ki Entèdi</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Pa itilize platfòm nan pou aktivite ki pa legal</li>
                <li>Pa eseye aksede sistèm nan san otorizasyon</li>
                <li>Pa voye enfòmasyon ki fo oswa ki twonpe</li>
                <li>Pa itilize sèvis la pou fè lavni oswa finansman teworis</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">5. Konfidansyalite</h3>
              <p>
                Nou pwoteje enfòmasyon pèsonèl ou yo ak teknoloji sekirite ki pi avanse yo. 
                Li règleman konfidansyalite nou an pou plis detay.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">6. Modifikasyon</h3>
              <p>
                Nou gen dwa modifye kondisyon yo nenpòt lè. Nou ap notifye ou sou chanjman yo 
                ki enpòtan. Kontinye itilize sèvis la apre chanjman yo vle di ou aksepte yo.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">7. Kontak</h3>
              <p>
                Si ou gen kesyon sou kondisyon yo, kontakte nou nan:
              </p>
              <ul className="list-none space-y-1 ml-4 mt-2">
                <li>📧 Email: support@cashtimachann.com</li>
                <li>📞 Telefòn: +509 2222-3333</li>
                <li>📍 Adrès: Port-au-Prince, Ayiti</li>
              </ul>
            </section>
          </div>
        </div>

        {/* Back Links */}
        <div className="flex justify-center space-x-6 mt-8">
          <Link href="/register" className="text-primary-600 hover:text-primary-500">
            ← Retounen nan enskripsyon
          </Link>
          <Link href="/" className="text-gray-400 hover:text-gray-300">
            Paj akèy
          </Link>
        </div>
      </div>
    </div>
  )
}
