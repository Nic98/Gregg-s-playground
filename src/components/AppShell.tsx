import { useEffect, useRef, useState } from 'react';
import { BookOpen, Grid3X3, Menu, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { sectionRoute, syllabus } from '@/src/data/syllabus';

function SyllabusNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <>
      <Link
        to="/"
        className="brand-lockup"
        onClick={onNavigate}
        aria-label="Gregg’s IGCSE CS Playground home"
      >
        <span className="brand-mark">
          <Grid3X3 />
        </span>
        <span>
          <strong>Gregg’s</strong>
          <small>IGCSE CS Playground</small>
        </span>
      </Link>
      <nav className="syllabus-nav" aria-label="2026–2028 syllabus topics">
        {[1, 2].map((paper) => (
          <div key={paper} className="nav-paper-group">
            <p className="nav-label">
              Paper {paper} · Topics {paper === 1 ? '1–6' : '7–10'}
            </p>
            {syllabus
              .filter((topic) => topic.paper === paper)
              .map((topic) => {
                const isActive = topic.sections.some(
                  (section) =>
                    section.route &&
                    location.pathname.startsWith(section.route),
                );
                return (
                  <div key={topic.number} className="nav-topic-block">
                    <div
                      className={
                        isActive ? 'topic-link topic-link-active' : 'topic-link'
                      }
                    >
                      <span className="topic-number">{topic.number}</span>
                      <span>{topic.title}</span>
                      {!topic.sections.some(
                        (section) => section.status === 'live',
                      ) && <span className="nav-coming">Coming soon</span>}
                    </div>
                    {topic.sections.length > 0 && (
                      <div className="subtopic-list">
                        {topic.sections.map((section) =>
                          section.route ? (
                            <NavLink
                              key={section.id}
                              to={section.route}
                              onClick={onNavigate}
                              className={({ isActive }) =>
                                isActive
                                  ? 'subtopic-link subtopic-link-active'
                                  : 'subtopic-link'
                              }
                            >
                              <span>{section.id}</span>
                              {section.title}
                            </NavLink>
                          ) : (
                            <span
                              key={section.id}
                              className="subtopic-link subtopic-disabled"
                            >
                              <span>{section.id}</span>
                              <span className="subtopic-title">
                                {section.title}
                                <small>Coming soon</small>
                              </span>
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <BookOpen />
        <span>
          <strong>Cambridge IGCSE</strong>
          <small>Computer Science 0478</small>
        </span>
      </div>
    </>
  );
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = [
        ...drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      menuButton?.focus();
    };
  }, [menuOpen]);

  return (
    <div className="app-shell">
      <aside className="site-sidebar">
        <SyllabusNavigation />
      </aside>
      <div className="mobile-topbar">
        <Link to="/" className="mobile-brand">
          <span className="brand-mark">
            <Grid3X3 />
          </span>
          <strong>Gregg’s CS Playground</strong>
        </Link>
        <Button
          ref={menuButtonRef}
          variant="outline"
          size="icon-lg"
          onClick={() => setMenuOpen(true)}
          aria-label="Open syllabus navigation"
        >
          <Menu />
        </Button>
      </div>
      {menuOpen && (
        <dialog
          ref={drawerRef}
          open
          className="mobile-drawer"
          aria-modal="true"
          aria-label="Syllabus navigation"
        >
          <button
            type="button"
            tabIndex={-1}
            className="drawer-backdrop"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="drawer-panel">
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="icon-lg"
              className="drawer-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation"
            >
              <X />
            </Button>
            <SyllabusNavigation onNavigate={() => setMenuOpen(false)} />
          </aside>
        </dialog>
      )}
      <div className="page-column">
        <Outlet />
      </div>
    </div>
  );
}

export function ComingSoonBadge() {
  return (
    <Badge variant="outline" className="coming-soon-badge">
      Coming soon
    </Badge>
  );
}

export function LiveBadge() {
  return <Badge className="live-badge">Live demo</Badge>;
}

export { sectionRoute };
