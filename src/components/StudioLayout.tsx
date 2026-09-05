import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppShell } from './AppShell';
import { sectionRoute } from '../data/syllabus';
import '../studio.css';

export function StudioLayout({
  title,
  kind,
  children,
  reference,
  showSettings = true,
}: {
  title: string;
  kind: 'text' | 'sound';
  children: ReactNode;
  reference: ReactNode;
  showSettings?: boolean;
}) {
  const { openNavigation } = useAppShell();
  const ref = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    document.title = `${title} · Gregg’s IGCSE CS Playground`;
    const update = () => setFull(document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, [title]);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await ref.current?.requestFullscreen();
    } catch {
      setError(
        'Fullscreen is unavailable in this browser. You can still use all the lab controls.',
      );
    }
  }
  return (
    <main className={`studio studio--${kind}`}>
      <div className="studio-workbench" ref={ref}>
        <header className="studio-toolbar">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open course navigation"
            onClick={openNavigation}
          >
            <BookOpen />
          </Button>
          <Link className="studio-back" to={sectionRoute}>
            <ArrowLeft size={16} />
            <span>Topic 1.2</span>
          </Link>
          <h1>{title}</h1>
          <Button variant="outline" onClick={toggleFullscreen}>
            {full ? <Minimize /> : <Maximize />}
            <span className="fullscreen-label">
              {full ? 'Exit fullscreen' : 'Fullscreen'}
            </span>
          </Button>
        </header>
        {error && <output>{error}</output>}
        {children}
        {showSettings && (
          <nav className="studio-quicknav" aria-label="Mobile studio shortcuts">
            <Button
              variant="outline"
              onClick={() =>
                ref.current
                  ?.querySelector<HTMLElement>('.studio-stage')
                  ?.focus()
              }
            >
              Back to lab
            </Button>
            <Button
              variant="default"
              onClick={() =>
                ref.current?.querySelector<HTMLElement>('.studio-rail')?.focus()
              }
            >
              Settings
            </Button>
          </nav>
        )}
      </div>
      <section className="studio-reference">
        <p className="studio-kicker">0478 / 1.2 · Syllabus essentials</p>
        {reference}
      </section>
    </main>
  );
}
export function Walkthrough({
  steps,
  step,
  setStep,
}: {
  steps: { title: string; text: string }[];
  step: number;
  setStep: (step: number) => void;
}) {
  return (
    <section className="studio-lesson" aria-label="Walkthrough">
      <div className="studio-row">
        <span className="studio-kicker">
          Step {step + 1} / {steps.length}
        </span>
        <Button variant="ghost" onClick={() => setStep(0)}>
          Restart
        </Button>
      </div>
      <h3>{steps[step].title}</h3>
      <p>{steps[step].text}</p>
      <div className="studio-row">
        <Button
          variant="outline"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          Previous
        </Button>
        <Button
          variant="default"
          disabled={step === steps.length - 1}
          onClick={() => setStep(step + 1)}
        >
          Next step
        </Button>
      </div>
    </section>
  );
}
