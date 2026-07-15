import { Link } from 'react-router-dom';

export default function Button({ to, href, variant = 'secondary', children, className = '', ...props }) {
  const base = 'inline-flex min-h-[44px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-pink-600 focus-visible:outline-brand-primary',
    secondary: 'border border-brand-border bg-white text-brand-text hover:bg-brand-surface-hover hover:text-brand-primary focus-visible:outline-brand-primary',
    link: 'text-brand-body hover:text-brand-primary focus-visible:outline-brand-primary',
  };
  const classes = `${base} ${variants[variant] || variants.secondary} ${className}`;
  if (to) return <Link to={to} className={classes} {...props}>{children}</Link>;
  return <a href={href} className={classes} {...props}>{children}</a>;
}
