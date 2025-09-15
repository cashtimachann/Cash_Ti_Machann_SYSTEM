import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-primary-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Cash Ti <span className="text-primary-600">Machann</span>
          </h1>
          <h2 className="text-2xl text-gray-300">Règleman Konfidansyalite</h2>
        </div>

        {/* Privacy Content */}
        <div className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-xl border border-primary-600/20 text-gray-300">
          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-semibold text-white mb-3">1. Enfòmasyon nou Kolekte</h3>
              <p className="mb-3">Nou kolekte enfòmasyon sa yo lè ou itilize sèvis nou an:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Enfòmasyon pèsonèl (non, prenon, dat nesans)</li>
                <li>Enfòmasyon kontak (telefòn, email, adrès)</li>
                <li>Enfòmasyon idantifikasyon (nimewo CIN, paspò)</li>
                <li>Enfòmasyon tranzaksyon ak aktivite finansye</li>
                <li>Enfòmasyon teknik (IP address, divais)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">2. Kijan nou Itilize Enfòmasyon yo</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Pou pwosede tranzaksyon finansye yo</li>
                <li>Pou verifye idantite ou ak sekirite kont</li>
                <li>Pou konfòme ak règleman ak lwa yo</li>
                <li>Pou amelyore sèvis ak sipò kliyan</li>
                <li>Pou kominike ak ou sou kont ou</li>
                <li>Pou prevni ak detekte fwòd</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">3. Pwoteksyon Enfòmasyon</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Chifreman SSL/TLS pou tout kominikasyon yo</li>
                <li>Otentifikasyon 2 faktè obligatwa</li>
                <li>Sistèm sekirite 24/7 ak monitè</li>
                <li>Aksè limite sèlman pou anplwaye otorize yo</li>
                <li>Backup ak pwoteksyon done yo</li>
                <li>Konformite ak estanda sekirite entènasyonal yo</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">4. Pataj Enfòmasyon</h3>
              <p className="mb-3">Nou pa vann oswa ba moun enfòmasyon pèsonèl ou yo. Nou ka pataje enfòmasyon nan ka sa yo:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Ak patnè finansye nou yo pou pwosede tranzaksyon</li>
                <li>Ak otorite yo lè lwa a mande l</li>
                <li>Ak konpanyi sekirite nou yo pou pwoteje kont ou</li>
                <li>Nan ka ijans pou pwoteje sekirite ak sante</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">5. Dwa ou yo</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Dwa pou aksede enfòmasyon nou gen sou ou</li>
                <li>Dwa pou korije enfòmasyon ki pa egzak</li>
                <li>Dwa pou efase kont ou ak done yo</li>
                <li>Dwa pou limite pwosèsman enfòmasyon yo</li>
                <li>Dwa pou resevwa kopi enfòmasyon ou yo</li>
                <li>Dwa pou retiré konsantman ou</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">6. Cookies ak Teknoloji</h3>
              <p>
                Nou itilize cookies ak teknoloji similè yo pou amelyore eksperyans ou ak sekirite. 
                Ou ka kontrole cookies yo nan paramèt navigatè ou an.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">7. Retansyon Done</h3>
              <p>
                Nou kenbe enfòmasyon ou yo sèlman pou tan ki nesesè yo selon lwa ak règleman yo. 
                Lè nou pa bezwen yo ankò, nou detwi yo nan fason sekirize.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">8. Chanjman nan Règleman</h3>
              <p>
                Nou ka modifye règleman konfidansyalite a. Nou ap notifye ou sou chanjman enpòtan yo 
                ak email oswa nan aplikasyon an.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-white mb-3">9. Kontak pou Konfidansyalite</h3>
              <p>
                Pou kesyon sou konfidansyalite oswa pou egzèse dwa ou yo, kontakte nou:
              </p>
              <ul className="list-none space-y-1 ml-4 mt-2">
                <li>📧 Email: privacy@cashtimachann.com</li>
                <li>📞 Telefòn: +509 2222-3344</li>
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
