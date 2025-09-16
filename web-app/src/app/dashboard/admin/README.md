# Routes du Dashboard Admin

Avec la nouvelle structure, chaque section du dashboard admin a maintenant sa propre URL :

## Routes disponibles

### 📊 **Vue d'ensemble**
- **URL**: `/dashboard/admin`
- **Description**: Page principale avec les statistiques et activités récentes

### 👥 **Gestion des Clients**
- **URL**: `/dashboard/admin/users`
- **Description**: Liste des clients, création, modification et gestion des utilisateurs

### 💳 **Transactions**
- **URL**: `/dashboard/admin/transactions`
- **Description**: Gestion et supervision des transactions

### 🧑‍💼 **Agents Autorisés**
- **URL**: `/dashboard/admin/agents`
- **Description**: Liste et gestion des agents

### 🏪 **Ti Machann (Marchands)**
- **URL**: `/dashboard/admin/merchants`
- **Description**: Liste et gestion des entreprises/marchands

### 💰 **Finances**
- **URL**: `/dashboard/admin/finance`
- **Description**: Gestion financière, bilans et rapports

### 📈 **Rapports**
- **URL**: `/dashboard/admin/reports`
- **Description**: Génération de rapports et statistiques

### 🔒 **Sécurité**
- **URL**: `/dashboard/admin/security`
- **Description**: Paramètres de sécurité et logs

### ⚙️ **Paramètres**
- **URL**: `/dashboard/admin/settings`
- **Description**: Configuration du système

## Navigation

- **Navigation par URL directe**: Vous pouvez maintenant naviguer directement vers n'importe quelle section
- **Menu sidebar**: La navigation reste disponible via le menu latéral
- **Menu mobile**: Menu burger pour les écrans mobiles
- **Breadcrumbs**: L'URL reflète la section actuelle

## Fonctionnalités

✅ **Layout partagé** : Header, sidebar et logique d'authentification communes
✅ **Routing Next.js** : Utilisation des App Routes de Next.js 13+
✅ **Navigation responsive** : Menu mobile adaptatif
✅ **URLs persistantes** : Chaque page a sa propre URL
✅ **Navigation active** : Indicateur visuel de la page courante

## Comment utiliser

1. **Navigation directe** : Tapez l'URL dans le navigateur
2. **Menu sidebar** : Cliquez sur les éléments du menu
3. **Menu mobile** : Utilisez le burger menu sur mobile
4. **Liens internes** : Les liens dans l'application utilisent les nouvelles routes

Les anciennes fonctionnalités tab-based ont été remplacées par un vrai système de routing avec des URLs propres !