# Rapport mensuel d'activité hospitalière

Application web gratuite : chaque service remplit son formulaire mensuel avec son propre
identifiant ; l'administrateur voit tous les services, le total, et exporte en Excel.
Les indicateurs (TOM, DMS, rotation des lits) sont calculés automatiquement.

**Technologies** : React + Vite + Tailwind (site) · Firebase offre gratuite *Spark*
(connexion + base de données) · Vercel ou Netlify (hébergement).

---------------------------------------------------------------------

## 1. Installer les outils (une seule fois)

1. Installez **Node.js** (version LTS) : https://nodejs.org
2. Ouvrez un terminal (Windows : « Invite de commandes » ou PowerShell) et vérifiez :
   ```
   node -v
   npm -v
   ```
3. Dézippez le projet, puis placez le terminal dans le dossier :
   ```
   cd rapport-hopital
   npm install
   ```

## 2. Créer le projet Firebase (gratuit)

1. Allez sur https://console.firebase.google.com avec un compte Google → **Ajouter un projet**
   (désactivez Google Analytics, inutile). Gardez l'offre gratuite **Spark**.
2. **Authentication** → *Commencer* → onglet *Méthode de connexion* → activez **E-mail/Mot de passe**.
3. **Firestore Database** → *Créer une base de données* → mode **production** →
   choisissez un emplacement proche (ex. `eur3 (europe)` ou `europe-west`). Ce choix est définitif.
4. **Paramètres du projet** (roue dentée) → *Vos applications* → icône **`</>`** (Web) →
   donnez un nom → *Enregistrer l'application*. Firebase affiche une configuration (`firebaseConfig`).
5. Copiez le fichier `.env.example` en `.env` et recopiez les valeurs :
   ```
   copy .env.example .env        (Windows)
   cp .env.example .env          (Mac / Linux)
   ```
   Ouvrez `.env` avec le Bloc-notes et remplissez les 6 valeurs (`apiKey` → `VITE_FIREBASE_API_KEY`, etc.).

> Si Firebase vous demande une carte bancaire pour Firestore ou Authentication, arrêtez-vous
> et vérifiez les conditions actuelles de l'offre Spark sur https://firebase.google.com/pricing

## 3. Publier les règles de sécurité (obligatoire)

Ces règles garantissent qu'un service ne voit que ses propres données.

**Méthode simple** : console Firebase → Firestore Database → onglet **Règles** →
supprimez tout, collez le contenu du fichier `firestore.rules` → **Publier**.
(Si la console signale une erreur de syntaxe, elle l'affiche en rouge : ne publiez pas avant correction.)

**Méthode en ligne de commande** (facultative) :
```
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project VOTRE_ID_DE_PROJET
```

## 4. Créer les comptes (admin + 17 services) en une commande

1. Console Firebase → **Paramètres du projet** → onglet **Comptes de service** →
   **Générer une nouvelle clé privée** → enregistrez le fichier téléchargé dans le dossier du
   projet sous le nom exact **`serviceAccountKey.json`**.
   ⚠️ Ce fichier est un secret : ne l'envoyez à personne, ne le publiez jamais (il est déjà
   exclu de Git par `.gitignore`). Supprimez-le après l'étape 4.
2. Copiez `scripts/comptes.exemple.json` en `scripts/comptes.json` et **remplacez les e-mails**
   par ceux que vous voulez (ils n'ont pas besoin d'être de vraies boîtes mail, mais sans vraie boîte
   le bouton « Mot de passe oublié » ne fonctionnera pas : voir plus bas).
   Pour ajouter un administrateur, ajoutez une ligne avec `"role": "admin"`.
3. Lancez :
   ```
   npm run creer-comptes
   ```
4. Le fichier **`comptes_generes.csv`** (ouvrable avec Excel) contient l'e-mail et le mot de passe
   de chaque compte. Remettez-les aux services en main propre, puis **supprimez ce fichier**.

Pour redonner un nouveau mot de passe à un service qui l'a perdu :
```
npm run creer-comptes -- --reinitialiser
```
(attention : cela change le mot de passe de TOUS les comptes listés dans `comptes.json` ;
retirez du fichier les comptes à ne pas toucher avant de lancer).

## 5. Tester sur votre ordinateur

```
npm run test      # vérifie les calculs (TOM, DMS, rotation)
npm run dev       # lance le site sur http://localhost:5173
npm run build     # construit la version finale (dossier dist)
```
Connectez-vous avec un compte service : remplissez, enregistrez, soumettez.
Puis avec le compte administrateur : vérifiez le tableau de bord et l'export Excel.

## 6. Mettre en ligne

### Option A : Vercel
1. Créez un dépôt GitHub (privé) et envoyez-y le projet :
   ```
   git init
   git add .
   git commit -m "premiere version"
   git branch -M main
   git remote add origin https://github.com/VOTRE_COMPTE/rapport-hopital.git
   git push -u origin main
   ```
2. https://vercel.com → *Add New… → Project* → importez le dépôt (le réglage « Vite » est détecté).
3. Avant de cliquer sur *Deploy*, ouvrez **Environment Variables** et ajoutez les 6 variables
   `VITE_FIREBASE_…` avec les mêmes valeurs que dans votre fichier `.env`.
4. *Deploy*. Vous obtenez une adresse `https://….vercel.app`.

### Option B : Netlify
1. Même dépôt GitHub. https://app.netlify.com → *Add new site → Import an existing project*.
2. Commande de build : `npm run build` · Dossier de publication : `dist` (déjà dans `netlify.toml`).
3. *Site configuration → Environment variables* : ajoutez les 6 variables `VITE_FIREBASE_…`.
4. Déployez (si vous avez ajouté les variables après, relancez un déploiement).

> `.env` n'est jamais envoyé sur GitHub : c'est pour cela qu'il faut recopier les variables chez Vercel/Netlify.

## 7. Utilisation au quotidien

- **Service** : choisit le mois (le mois précédent est proposé), remplit, *Enregistrer le brouillon*
  autant de fois que nécessaire, puis *Soumettre*. Après soumission, le formulaire est verrouillé.
- **Administrateur** : tableau de bord du mois, statut de chaque service, total et indicateurs globaux.
  Bouton **Rouvrir** pour qu'un service corrige un rapport soumis. Bouton **Exporter en Excel**.
- Faites un **export Excel chaque mois** : c'est votre sauvegarde.

## 8. Modifier la liste des services

Les services sont dans `src/lib/constants.ts` (liste `SERVICES`) **et** dans
`scripts/creer-comptes.mjs` (liste `SERVICES_VALIDES`). L'identifiant ne doit contenir ni
majuscule, ni espace, ni `_`. Ajoutez le compte dans `scripts/comptes.json`, relancez
`npm run creer-comptes`, puis redéployez le site (`git push`).

## 9. Dépannage

| Message / symptôme | Cause probable |
|---|---|
| Page « Configuration Firebase manquante » | `.env` absent ou incomplet ; sur Vercel/Netlify, variables non ajoutées (puis redéployer). |
| « E-mail ou mot de passe incorrect » | Mauvais identifiants ; redonnez un mot de passe (étape 4). |
| « Ce compte n'est associé à aucun service » | Le profil n'existe pas : relancez `npm run creer-comptes`. |
| « Impossible de lire votre profil » / droits refusés | Règles Firestore non publiées (étape 3) ou pas de connexion. |
| « Mot de passe oublié » sans effet | L'e-mail n'est pas une vraie boîte mail : utilisez `--reinitialiser`. |
| `creer-comptes` : « serviceAccountKey.json introuvable » | Étape 4.1 non faite ou fichier mal nommé/placé. |
| Sur Vercel : écran blanc | Variables `VITE_FIREBASE_…` manquantes : ajoutez-les puis *Redeploy*. |

## 10. Sécurité : à retenir

- Les données sont des **chiffres agrégés**, jamais des données de patients : n'en saisissez pas dans « Observations ».
- Ne partagez jamais `serviceAccountKey.json` ni `comptes_generes.csv`.
- Désactiver un compte : dans la console Firestore, collection `users`, document de l'e-mail → `actif` = `false`.
- Le package `xlsx` (npm) affiche des alertes dans `npm audit` : elles concernent la *lecture* de
  fichiers non fiables ; ici il ne sert qu'à *écrire* l'export Excel.
