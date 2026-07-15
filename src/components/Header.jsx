import { useState } from 'react';
import { Link } from 'react-router-dom';
import Container from './Container.jsx';
import Navbar from './Navbar.jsx';
import Button from './Button.jsx';
import MobileMenu from './MobileMenu.jsx';
import { navItems, actionItems } from '../data/navigation.js';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-brand-bg/90 backdrop-blur">
      <Container className="flex min-h-[70px] items-center justify-between gap-6">
        <Link to="/" className="font-bold text-brand-text" aria-label="Retour à l’accueil Équilibre Vital">Équilibre Vital</Link>
        <Navbar items={navItems} />
        <div className="hidden lg:flex items-center gap-3">
          {actionItems.map((item) => <Button key={item.href} to={item.href} variant={item.variant}>{item.label}</Button>)}
        </div>
        <button
          type="button"
          className="lg:hidden min-h-[44px] min-w-[44px] rounded-full border border-brand-border bg-white"
          aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsOpen((open) => !open)}
        >
          Menu
        </button>
      </Container>
      <MobileMenu id="mobile-menu" isOpen={isOpen} navItems={navItems} actionItems={actionItems} onClose={() => setIsOpen(false)} />
    </header>
  );
}
