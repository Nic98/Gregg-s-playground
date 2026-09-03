import type { ReactNode } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  eyebrow: ReactNode;
  title: string;
  description: string;
  breadcrumbs?: Array<{ label: string; route?: string }>;
  action?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs = [],
  action,
}: PageHeaderProps) {
  return (
    <>
      <div className="page-topline">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/" aria-label="Home">
            <Home />
          </Link>
          {breadcrumbs.map((item) => (
            <span className="breadcrumb-segment" key={item.label}>
              <ChevronRight />
              {item.route ? (
                <Link to={item.route}>{item.label}</Link>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
        {action}
      </div>
      <header className="page-hero">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
    </>
  );
}
