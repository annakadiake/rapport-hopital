// Crée (ou réinitialise) les comptes de connexion et leurs profils dans Firebase.
//
// Usage :
//   npm run creer-comptes                      -> crée les comptes qui n'existent pas encore
//   npm run creer-comptes -- --reinitialiser   -> génère aussi un NOUVEAU mot de passe pour les comptes existants
//
// Prérequis : fichier "serviceAccountKey.json" à la racine du projet (clé privée Firebase)
//             et fichier "scripts/comptes.json" (copie modifiée de comptes.exemple.json).

import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import fs from 'node:fs'
import crypto from 'node:crypto'

const SERVICES_VALIDES = [
  'medecine-generale', 'pediatrie', 'cardiologie', 'urologie', 'pneumologie',
  'maladies-infectieuses', 'neurologie', 'anesthesie-reanimation', 'chirurgie-generale',
  'neurochirurgie', 'ophtalmologie', 'orl', 'gyneco-obstetrique', 'reeducation-fonctionnelle',
  'orthopedie', 'imagerie-medicale', 'oncologie-medicale',
]

function arreter(message) {
  console.error('\nERREUR : ' + message + '\n')
  process.exit(1)
}

if (!fs.existsSync('serviceAccountKey.json'))
  arreter("Fichier serviceAccountKey.json introuvable à la racine du projet (voir README, étape « Clé privée »).")
if (!fs.existsSync('scripts/comptes.json'))
  arreter("Fichier scripts/comptes.json introuvable. Copiez scripts/comptes.exemple.json en scripts/comptes.json puis modifiez les e-mails.")

const reinitialiser = process.argv.includes('--reinitialiser')
const cle = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'))
const comptes = JSON.parse(fs.readFileSync('scripts/comptes.json', 'utf8'))

initializeApp({ credential: cert(cle) })
const auth = getAuth()
const db = getFirestore()

// Mot de passe lisible : 12 caractères, sans caractères ambigus (0/O, 1/l/I)
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function motDePasse() {
  const octets = crypto.randomBytes(12)
  return Array.from(octets, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

const lignes = [['email', 'motdepasse', 'service', 'role', 'etat']]

for (const c of comptes) {
  const email = String(c.email || '').trim().toLowerCase()
  if (!email.includes('@')) arreter(`E-mail invalide : « ${c.email} »`)
  if (c.role !== 'admin' && c.role !== 'service') arreter(`Rôle invalide pour ${email} (admin ou service)`)
  if (c.role === 'service' && !SERVICES_VALIDES.includes(c.serviceId))
    arreter(`serviceId inconnu pour ${email} : « ${c.serviceId} ». Valeurs possibles : ${SERVICES_VALIDES.join(', ')}`)

  let etat = ''
  let mdp = ''
  try {
    const existant = await auth.getUserByEmail(email)
    if (reinitialiser) {
      mdp = motDePasse()
      await auth.updateUser(existant.uid, { password: mdp })
      etat = 'mot de passe réinitialisé'
    } else {
      etat = 'existait déjà (mot de passe inchangé)'
    }
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      mdp = motDePasse()
      await auth.createUser({ email, password: mdp, displayName: c.nom || c.serviceId || email })
      etat = 'créé'
    } else throw e
  }

  const profil = { email, role: c.role, actif: true }
  if (c.role === 'service') profil.serviceId = c.serviceId
  await db.collection('users').doc(email).set(profil)

  lignes.push([email, mdp, c.serviceId || '-', c.role, etat])
  console.log(`${etat.padEnd(38)} ${email}`)
}

fs.writeFileSync('comptes_generes.csv', '\ufeff' + lignes.map((l) => l.join(';')).join('\n'), 'utf8')
console.log('\nTerminé. Les mots de passe sont dans le fichier : comptes_generes.csv')
console.log('Distribuez-les en main propre puis SUPPRIMEZ ce fichier.')
