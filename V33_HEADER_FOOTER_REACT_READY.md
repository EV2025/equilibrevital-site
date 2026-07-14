# V33 — Header/Footer React-ready

Objectif : stabiliser le header, le menu principal, le menu mobile et le footer sans modifier le contenu des pages ni le super cercle PSSR.

## Menu principal unique

- Activités
- Dispositifs
- PSSR
- Connexion
- Je m’inscris

Tous les autres liens sont rangés dans le footer.

## Implémentation actuelle GitHub Pages

Le site actuel reste en HTML statique. Pour éviter les conflits entre pages, une couche unique génère le shell de navigation :

- `assets/js/v33-react-shell.js`
- `assets/css/v33-react-shell.css`

Cette couche utilise la même logique qu’un composant React : tableaux `navItems`, `actionItems`, `footerColumns`, rendu unique, menu mobile accessible, fermeture après clic et gestion clavier.

## Préparation React / Vite

Des composants prêts pour une migration React sont fournis dans :

- `src/components/Header.jsx`
- `src/components/Navbar.jsx`
- `src/components/MobileMenu.jsx`
- `src/components/Footer.jsx`
- `src/components/NavLink.jsx`
- `src/components/Button.jsx`
- `src/components/Container.jsx`
- `src/data/navigation.js`

Ils ne modifient pas le site statique actuel. Ils servent de base propre si le projet migre plus tard vers React / Vite.

## Accessibilité

- balises `header`, `nav`, `footer`
- `aria-label` sur les navigations
- `aria-expanded` et `aria-controls` sur le bouton menu
- fermeture au clic sur un lien
- fermeture avec `Escape`
- zones tactiles minimum 44px
- focus visible

## À ne pas modifier

- super cercle PSSR
- Firebase
- règles Firestore
- logique d’authentification
- formulaires connectés
