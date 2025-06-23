# 📝 Front Checklist

Application mobile de gestion de listes et d’items, développée avec **Expo (React Native)**.

## Fonctionnalités principales

- **Authentification** : Inscription et connexion sécurisées, gestion de session locale.
- **Gestion des listes** :
  - Création, édition, suppression, renommage de listes personnelles.
  - Affichage des listes triées par ordre alphabétique.
- **Gestion des items** :
  - Ajout, édition, suppression d’items dans chaque liste.
  - Deux types d’items : texte ou interrupteur (toggle).
  - Tri automatique des items.
- **Interface moderne** :
  - Composants personnalisés (Input, Button, Toggle, etc.).
  - Thématisation dynamique (couleurs, police, etc.).
  - Utilisation d’icônes et de sons pour améliorer l’expérience utilisateur.
- **Navigation** :
  - Navigation fluide entre les écrans (accueil, listes, détail d’une liste).
- **Connexion API** :
  - Appels sécurisés à un backend Node.js (API REST, token JWT).

---

## Installation

1. **Cloner le projet**
   ```bash
   git clone <repo-url>
   cd front-checklist
   ```
2. **Installer les dépendances**
   ```bash
   npm install
   ```
3. **Lancer l’application**
   ```bash
   npx expo start
   ```

> **Remarque :** L’application nécessite un backend compatible (voir la variable `url` dans les fichiers du dossier `app/`).

---

## Utilisation

- **Accueil** :
  - Inscription ou connexion avec nom d’utilisateur, email (pour inscription) et mot de passe.
  - Redirection automatique vers la page des listes si la session est active.
- **Listes** :
  - Affichage de toutes les listes de l’utilisateur connecté.
  - Ajout, édition, suppression, renommage de listes.
- **Détail d’une liste** :
  - Affichage et gestion des items (ajout, édition, suppression, type).
  - Possibilité d’activer/désactiver un son lors des actions.

---

## Structure du projet

```
front-checklist/
  app/                # Dossier principal de l’app (pages, composants, styles)
    components/       # Composants UI réutilisables (Button, Input, Toggle...)
    constants/        # Constantes (couleurs, etc.)
    styles/           # Fichiers de styles
    types/            # Types TypeScript personnalisés
    index.tsx         # Page d’accueil (authentification)
    lists.tsx         # Page de gestion des listes
    list.tsx          # Page de gestion d’une liste et de ses items
    _layout.tsx       # Layout général
  assets/             # Images, icônes, sons
  hooks/              # Hooks personnalisés (ex: useThemeColors)
  src/store/          # Stores pour la gestion d’état (items, listes)
  ...
```

---

## Points techniques

- **Expo Router** pour la navigation basée sur les fichiers.
- **AsyncStorage** pour la gestion locale de la session utilisateur.
- **Appels API** avec gestion du token JWT dans les headers.
- **Gestion des erreurs** et affichage de messages utilisateur.
- **Thématisation** via un hook personnalisé (`useThemeColors`).
- **Accessibilité** : labels, placeholders, contrastes adaptés.

---

## Configuration

- Modifier l’URL du backend dans les fichiers `app/index.tsx`, `app/lists.tsx`, `app/list.tsx` si besoin.
- Les assets (icônes, sons) sont dans le dossier `assets/`.

---

## Dépendances principales

- **React Native** (Expo)
- **expo-router**
- **@react-native-async-storage/async-storage**
- **TypeScript**

---

## Auteur

- Projet réalisé par [LR]

---

## Licence

Ce projet est open-source, sous licence MIT.
