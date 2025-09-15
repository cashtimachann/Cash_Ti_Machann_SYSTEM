# Cash Ti Machann - Plateforme de Services Financiers Numériques

## 🇭🇹 Platfòm Sèvis Finansye Dijital pou Ayiti

Cash Ti Machann se yon platfòm konplè sèvis finansye dijital ki fèt espesyalman pou mache ayisyen an. Nou ofri yon sistèm sekirite ak ki fasil pou itilize pou jesyon lajan, vòya lajan, ak peye faktè yo.

### 🎯 Objektif Pwojè

- **Enklizyon Finansyè**: Bay aksè nan sèvis finansye pou tout moun
- **Senpleste**: Entèfas modèn ak entegral
- **Sekirite**: Pwoteksyon total pou lajan ak done yo
- **Aksesibilite**: Sèvis 24/7 disponib
- **Pèfòmans**: Tranzaksyon ki fèt nan mwens pase 3 segond

### 🏗️ Estrikti Pwojè

```
Cash Ti Machann/
├── web-app/              # Application web (Next.js + TypeScript)
├── backend-api/          # API backend (Django REST Framework)
├── mobile-ios/           # Application mobile iOS (Swift)
├── mobile-android/       # Application mobile Android (Kotlin)
├── docs/                 # Documentation
└── .github/             # Configuration GitHub
```

## 🌟 Karakteristik

### 👥 Pwofil Itilizatè

1. **Administratè**
   - Super Admin: Jesyon konplè sistèm nan
   - Admin Finansyè: Sipèvizyon tranzaksyon ak rekonsilyasyon
   - Admin Support: Asistans kliyan ak jesyon tikè

2. **Kliyan**
   - Kreye ak jesyon kont
   - Vòya ak resevwa lajan
   - Peye faktè ak rechaje mobile
   - Depo ak retirè lajan

3. **Ajan Otorize**
   - Fè depo ak retirè nan kach
   - Asiste nan ouvèti kont
   - Suiv komisyon yo
   - Aksè nan istorik tranzaksyon

4. **Antrepriz/Machann**
   - Resevwa peman nan kliyan yo
   - Rapò finansyè detaye
   - Vifman bankè
   - Jesyon aksè anplwaye yo

### 💳 Sèvis Finansyè

- **Jesyon Kont**: Enskripyon ak login sekirize
- **KYC/KYB**: Verifikasyon idantite ak antrepriz
- **Tranzaksyon**: Depo, retirè, vòya P2P
- **Peman Faktè**: Elektrisite, dlo, telefòn
- **Rechaje Mobile**: Digicel, Natcom
- **QR Code**: Peman marchann yo

## 🛠️ Teknoloji yo

### Frontend
- **Web**: Next.js + TypeScript + Tailwind CSS
- **Mobile iOS**: Swift (FaceID/TouchID)
- **Mobile Android**: Kotlin (BiometricPrompt API)

### Backend
- **API**: Django REST Framework (Python)
- **Otantifikasyon**: OAuth2 + OpenID Connect
- **Base Done**: PostgreSQL 16 ak TDE

### Sekirite
- **Chifman**: TLS 1.3, AES-256
- **Mo de Pas**: Argon2 hashing
- **2FA**: Obligatwa pou tout itilizatè yo
- **Pwoteksyon**: Anti-XSS, CSRF, SQL Injection

### Enfrèstrikti
- **Cloud**: AWS (PCI DSS/SOC2 compliant)
- **Orchestration**: Kubernetes + Istio
- **CI/CD**: GitHub Actions ak security scans

## 🎨 Koulè ak Design

- **Koulè Prensipal**: Nwa (#000000) ak Wouj (#DC2626)
- **Theme**: Modèn, entegral, ak responsive
- **Aksesibilite**: Compatible ak tout aparèy yo

## 🚀 Kòmanse

### Kondisyon Prealableman

- Node.js 18+ (pou web app)
- Python 3.11+ (pou backend)
- PostgreSQL 14+ (pou database)
- Redis (pou cache ak Celery)

### Enstalasyon

1. **Web Application**
```bash
cd web-app
npm install
npm run dev
```

2. **Backend API**
```bash
cd backend-api
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Konfigirasyon

1. Kopye `.env.example` nan `.env`
2. Konfigire done database ak Redis
3. Mete SECRET_KEY ak API keys yo
4. Configure OAuth2 settings

## 📱 Mobile Applications

### iOS (Swift)
- **Kondisyon**: Xcode 15+, iOS 15+
- **Sekirite**: FaceID/TouchID integration
- **Build**: Xcode project nan `mobile-ios/`

### Android (Kotlin)
- **Kondisyon**: Android Studio, API Level 26+
- **Sekirite**: BiometricPrompt API
- **Build**: Gradle project nan `mobile-android/`

## 🔒 Sekirite ak Konfòmite

- **PCI DSS**: Payment Card Industry compliance
- **RGPD**: Data protection regulations
- **SOC 2 Type II**: Security controls
- **KYC/KYB**: Know Your Customer/Business
- **2FA**: Two-Factor Authentication obligatwa

## 📊 Monitoring ak Logging

- **SIEM**: Security Information and Event Management
- **WAF**: Web Application Firewall
- **Backup**: Backup quotidien chiffré
- **PRA/PCA**: Recovery < 30 minutes

## 🌍 Entenasyonalizasyon

- **Lang**: Kreyòl Ayisyen, Français
- **Timezone**: America/Port-au-Prince
- **Mone**: Gourde Haïtienne (HTG)
- **Fòma**: Date, nimewo selon estanda ayisyen yo

## 🤝 Kontribisyon

1. Fork pwojè a
2. Kreye feature branch (`git checkout -b feature/nouvo-karakteristik`)
3. Commit chanjman yo (`git commit -m 'Ajoute nouvo karakteristik'`)
4. Push nan branch (`git push origin feature/nouvo-karakteristik`)
5. Ouvri yon Pull Request

## 📝 Lisans

Pwojè sa a pwoteje pa lisans MIT. Gade `LICENSE` pou plis detay.

## 📞 Support

- **Email**: support@cashtimachann.com
- **Phone**: +509 xxxx-xxxx
- **Documentation**: [docs.cashtimachann.com](https://docs.cashtimachann.com)

## 🎯 Roadmap

### Phase 1: MVP (Q4 2025)
- [x] Web application ak dashboard yo
- [x] Backend API ak sekirite
- [ ] Mobile applications (iOS/Android)
- [ ] Basic payment integration

### Phase 2: Advanced Features (Q1 2026)
- [ ] Machine learning fraud detection
- [ ] Advanced analytics ak reporting
- [ ] International transfers
- [ ] Merchant POS integration

### Phase 3: Expansion (Q2 2026)
- [ ] Caribbean market expansion
- [ ] Banking partnerships
- [ ] Advanced financial products
- [ ] API marketplace

---

**Fèt ak ❤️ pou kominote ayisyen an**

## 🆕 Dual-Side Identity Document Upload

Nou ajoute sipò pou upload dokiman idantite an 2 fas (devant & dèyè).

Frontend:
- Paj enskripsyon (`/register`) pèmèt chaje `Fas Devant` ak `Fas Dèyè` anplis yon sèl fichye opsyonèl.
- Modal "Kreye Nouvo Kliyan" nan dashboard admin nan sipòte menm opsyon yo.
- Paj detay kliyan an (edit dokiman) deja sipòte 2 imaj.

Backend (UserProfile):
- Chans nouvo chan: `id_document_front`, `id_document_back` (ImageField)
- Chan istorik `id_document_image` toujou disponib pou konpatibilite.

API (multipart/form-data):
- `id_document_front`: imaj oswa PDF (≤5MB)
- `id_document_back`: imaj oswa PDF (≤5MB)
- `id_document`: ansyen sèl fichye (toujou aksepte)

Si tou de fas yo prezan, verifikasyon KYC pi fasil. Si sèlman youn oswa ansyen chan an vini, sistèm nan kontinye mache nòmalman.

*Cash Ti Machann - Finansye dijital pou tout moun*
