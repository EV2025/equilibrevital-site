import { NavLink as RouterNavLink } from 'react-router-dom';

export default function NavLink({ to, href, children, onClick }) {
  const classes = 'inline-flex min-h-[44px] items-center rounded-full px-3 text-sm font-semibold text-brand-body transition-colors hover:bg-brand-surface-hover hover:text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary';
  if (to) {
    return <RouterNavLink to={to} onClick={onClick} className={classes}>{children}</RouterNavLink>;
  }
  return <a href={href} onClick={onClick} className={classes}>{children}</a>;
}
