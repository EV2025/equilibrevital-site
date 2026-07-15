import NavLink from './NavLink.jsx';
import Button from './Button.jsx';

export default function MobileMenu({ id = 'mobile-menu', isOpen, navItems, actionItems, onClose }) {
  return (
    <nav id={id} aria-label="Navigation mobile" className={`${isOpen ? 'grid' : 'hidden'} lg:hidden fixed left-4 right-4 top-20 z-50 gap-2 rounded-3xl border border-brand-border bg-white/95 p-4 shadow-xl`}>
      {navItems.map((item) => <NavLink key={item.href} to={item.href} onClick={onClose}>{item.label}</NavLink>)}
      {actionItems.map((item) => (
        <Button key={item.href} to={item.href} variant={item.variant} onClick={onClose} className="w-full">
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
