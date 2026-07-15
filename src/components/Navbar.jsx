import NavLink from './NavLink.jsx';

export default function Navbar({ items }) {
  return (
    <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-2">
      {items.map((item) => <NavLink key={item.href} to={item.href}>{item.label}</NavLink>)}
    </nav>
  );
}
