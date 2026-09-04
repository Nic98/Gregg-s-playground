import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BookOpen, ChevronDown, Menu, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PixelMark } from '@/src/components/PixelMark';
import {
  sectionRoute,
  simulatorRoute,
  syllabus,
  type SyllabusTopic,
} from '@/src/data/syllabus';

export type ShellMode = 'catalogue' | 'section' | 'lab';

interface AppShellContextValue {
  navigationOpen: boolean;
  openNavigation: () => void;
  shellMode: ShellMode;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell(): AppShellContextValue {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error('useAppShell must be used inside AppShell.');
  }
  return context;
}

function getShellMode(pathname: string): ShellMode {
  if (pathname === '/') return 'catalogue';
  if (
    pathname === simulatorRoute ||
    pathname.startsWith(`${simulatorRoute}/`)
  ) {
    return 'lab';
  }
  return 'section';
}

function getCurrentTopic(pathname: string): SyllabusTopic | undefined {
  return syllabus.find((topic) =>
    topic.sections.some(
      (section) =>
        section.route &&
        (pathname === section.route ||
          pathname.startsWith(`${section.route}/`)),
    ),
  );
}

interface SyllabusNavigationProps {
  onNavigate?: () => void;
}

function SyllabusNavigation({ onNavigate }: SyllabusNavigationProps) {
  const location = useLocation();
  const navigationInstanceId = useId().replaceAll(':', '');
  const paperPanelId = `${navigationInstanceId}-paper-panel`;
  const currentTopic = useMemo(
    () => getCurrentTopic(location.pathname),
    [location.pathname],
  );
  const [selectedPaper, setSelectedPaper] = useState<1 | 2>(
    currentTopic?.paper ?? 1,
  );
  const [expandedTopic, setExpandedTopic] = useState<number | null>(
    currentTopic?.number ?? null,
  );
  const paperTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!currentTopic) return;
    setSelectedPaper(currentTopic.paper);
    setExpandedTopic(currentTopic.number);
  }, [currentTopic]);

  const visibleTopics = syllabus.filter(
    (topic) => topic.paper === selectedPaper,
  );

  const selectPaper = (paper: 1 | 2) => {
    setSelectedPaper(paper);
    setExpandedTopic(
      currentTopic?.paper === paper ? currentTopic.number : null,
    );
  };

  const handlePaperKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    paper: 1 | 2,
  ) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    let nextPaper = paper;
    if (event.key === 'ArrowLeft' || event.key === 'Home') nextPaper = 1;
    if (event.key === 'ArrowRight' || event.key === 'End') nextPaper = 2;
    event.preventDefault();
    if (nextPaper === paper) return;

    selectPaper(nextPaper);
    paperTabRefs.current[nextPaper - 1]?.focus();
  };

  return (
    <div className="syllabus-navigation">
      <Link
        to="/"
        className="brand-lockup"
        onClick={onNavigate}
        aria-label="Gregg’s IGCSE CS Playground home"
      >
        <PixelMark className="brand-mark" />
        <span className="brand-lockup__text">
          <strong>Gregg’s</strong>
          <small>IGCSE CS Playground</small>
        </span>
      </Link>

      <nav className="syllabus-nav" aria-label="2026–2028 syllabus topics">
        <div
          className="paper-switch"
          role="tablist"
          aria-label="Choose a syllabus paper"
        >
          {([1, 2] as const).map((paper) => (
            <button
              key={paper}
              ref={(node) => {
                paperTabRefs.current[paper - 1] = node;
              }}
              type="button"
              role="tab"
              id={`${navigationInstanceId}-paper-${paper}-tab`}
              aria-controls={paperPanelId}
              aria-selected={selectedPaper === paper}
              tabIndex={selectedPaper === paper ? 0 : -1}
              className={
                selectedPaper === paper
                  ? 'paper-switch__tab paper-switch__tab--active'
                  : 'paper-switch__tab'
              }
              onClick={() => selectPaper(paper)}
              onKeyDown={(event) => handlePaperKeyDown(event, paper)}
            >
              Paper {paper}
            </button>
          ))}
        </div>

        <div
          className="syllabus-paper"
          id={paperPanelId}
          role="tabpanel"
          aria-labelledby={`${navigationInstanceId}-paper-${selectedPaper}-tab`}
        >
          <p className="nav-label">
            {selectedPaper === 1
              ? 'Computer systems · Topics 1–6'
              : 'Algorithms and programming · Topics 7–10'}
          </p>

          <div className="nav-topic-list">
            {visibleTopics.map((topic) => {
              const isCurrent = currentTopic?.number === topic.number;
              const isExpanded = expandedTopic === topic.number;
              const hasLiveSection = topic.sections.some(
                (section) => section.status === 'live',
              );
              const topicId = `${navigationInstanceId}-topic-${topic.number}-sections`;
              const rowClassName = [
                'topic-row',
                isCurrent ? 'topic-row--current' : '',
                isExpanded ? 'topic-row--expanded' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div className="nav-topic-block" key={topic.number}>
                  {hasLiveSection ? (
                    <button
                      type="button"
                      className={rowClassName}
                      aria-controls={topicId}
                      aria-expanded={isExpanded}
                      onClick={() =>
                        setExpandedTopic((selected) =>
                          selected === topic.number ? null : topic.number,
                        )
                      }
                    >
                      <span className="topic-number">
                        {String(topic.number).padStart(2, '0')}
                      </span>
                      <span className="topic-row__copy">
                        <span>{topic.title}</span>
                        <small>
                          {hasLiveSection ? 'Live lab' : 'On the workbench'}
                        </small>
                      </span>
                      <ChevronDown className="topic-row__chevron" />
                    </button>
                  ) : (
                    <div className={`${rowClassName} topic-row--static`}>
                      <span className="topic-number">
                        {String(topic.number).padStart(2, '0')}
                      </span>
                      <span className="topic-row__copy">
                        <span>{topic.title}</span>
                        <small>On the workbench</small>
                      </span>
                    </div>
                  )}

                  {hasLiveSection && (
                    <div
                      className="subtopic-list"
                      id={topicId}
                      hidden={!isExpanded}
                    >
                      {topic.sections.map((section) =>
                        section.route ? (
                          <NavLink
                            key={section.id}
                            to={section.route}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                              isActive
                                ? 'subtopic-link subtopic-link--active'
                                : 'subtopic-link'
                            }
                          >
                            <span className="subtopic-link__number">
                              {section.id}
                            </span>
                            <span>{section.title}</span>
                          </NavLink>
                        ) : (
                          <div
                            key={section.id}
                            className="subtopic-link subtopic-link--static"
                          >
                            <span className="subtopic-link__number">
                              {section.id}
                            </span>
                            <span>{section.title}</span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="sidebar-footer">
        <BookOpen aria-hidden="true" />
        <span>
          <strong>Cambridge IGCSE</strong>
          <small>Computer Science 0478</small>
        </span>
      </div>
    </div>
  );
}

export function AppShell() {
  const location = useLocation();
  const shellMode = getShellMode(location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const openNavigation = useCallback(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : menuButtonRef.current;
    setMenuOpen(true);
  }, []);

  const closeNavigation = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    if (typeof drawer.showModal === 'function') {
      if (!drawer.open) drawer.showModal();
    } else {
      drawer.setAttribute('open', '');
    }

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeNavigation();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [
        ...drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter(
        (element) =>
          !element.closest('[hidden]') && element.getClientRects().length > 0,
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
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
      document.removeEventListener('keydown', handleKeyDown);
      if (drawer.open && typeof drawer.close === 'function') drawer.close();
      else drawer.removeAttribute('open');
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    };
  }, [closeNavigation, menuOpen]);

  const contextValue = useMemo(
    () => ({ navigationOpen: menuOpen, openNavigation, shellMode }),
    [menuOpen, openNavigation, shellMode],
  );

  return (
    <AppShellContext.Provider value={contextValue}>
      <div className={`app-shell app-shell--${shellMode}`}>
        {shellMode !== 'lab' && (
          <aside className="site-sidebar">
            <SyllabusNavigation />
          </aside>
        )}

        {shellMode !== 'lab' && (
          <div className="mobile-topbar">
            <Link to="/" className="mobile-brand">
              <PixelMark className="brand-mark" />
              <strong>Gregg’s CS Playground</strong>
            </Link>
            <Button
              ref={menuButtonRef}
              variant="outline"
              size="icon-lg"
              onClick={openNavigation}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-label="Open syllabus navigation"
            >
              <Menu />
            </Button>
          </div>
        )}

        {menuOpen && (
          <dialog
            ref={drawerRef}
            className="navigation-drawer"
            aria-modal="true"
            aria-label="Syllabus navigation"
            onCancel={(event) => {
              event.preventDefault();
              closeNavigation();
            }}
          >
            <button
              type="button"
              tabIndex={-1}
              className="drawer-backdrop"
              onClick={closeNavigation}
              aria-label="Close navigation"
            />
            <aside className="drawer-panel">
              <div className="drawer-heading">
                <p id="navigation-drawer-title">Course catalogue</p>
                <Button
                  ref={closeButtonRef}
                  variant="ghost"
                  size="icon-lg"
                  className="drawer-close"
                  onClick={closeNavigation}
                  aria-label="Close navigation"
                >
                  <X />
                </Button>
              </div>
              <SyllabusNavigation onNavigate={closeNavigation} />
            </aside>
          </dialog>
        )}

        <div className={`page-column page-column--${shellMode}`}>
          <Outlet />
        </div>
      </div>
    </AppShellContext.Provider>
  );
}

export function ComingSoonBadge() {
  return (
    <Badge variant="planned" className="status-badge status-badge--planned">
      On the workbench
    </Badge>
  );
}

export function LiveBadge() {
  return (
    <Badge variant="live" className="status-badge status-badge--live">
      Live lab
    </Badge>
  );
}

export { sectionRoute };
