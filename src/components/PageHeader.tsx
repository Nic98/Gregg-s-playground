import type { ReactNode } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export type HeaderVariant = 'catalogue' | 'section' | 'lab';

export interface PageHeaderProps {
  variant?: HeaderVariant;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: Array<{ label: string; route?: string }>;
  action?: ReactNode;
  titleId?: string;
}

export function PageHeader({
  variant = 'section',
  eyebrow,
  title,
  description,
  breadcrumbs = [],
  action,
  titleId,
}: PageHeaderProps) {
  const hasTopline = breadcrumbs.length > 0 || Boolean(action);

  return (
    <div className={`page-header page-header--${variant}`}>
      {hasTopline && (
        <div className="page-topline">
          {breadcrumbs.length > 0 && (
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link to="/" aria-label="Home">
                <Home aria-hidden="true" />
              </Link>
              {breadcrumbs.map((item, index) => (
                <span className="breadcrumb-segment" key={item.label}>
                  <ChevronRight aria-hidden="true" />
                  {item.route ? (
                    <Link to={item.route}>{item.label}</Link>
                  ) : (
                    <span
                      aria-current={
                        index === breadcrumbs.length - 1 ? 'page' : undefined
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          )}
          {action && <div className="page-topline__action">{action}</div>}
        </div>
      )}
      <header className={`page-hero page-hero--${variant}`}>
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1 id={titleId}>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </header>
    </div>
  );
}
