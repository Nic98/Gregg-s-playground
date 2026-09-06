import { useEffect } from 'react';
import {
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Music2,
  Keyboard,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { LiveBadge } from '@/src/components/AppShell';
import { PageHeader } from '@/src/components/PageHeader';
import { PixelMark } from '@/src/components/PixelMark';
import { studioDemos } from '@/src/data/syllabus';
import '../studio.css';

const icons = {
  text: FileText,
  sound: Music2,
  'sound-journey': Music2,
  image: ImageIcon,
  utf16: Keyboard,
};
export function SectionPage() {
  useEffect(() => {
    document.title = '1.2 Text, sound and images · Gregg’s Playground';
  }, []);
  return (
    <main className="page-wrap section-page">
      <PageHeader
        variant="section"
        eyebrow={
          <>
            <PixelMark className="section-pixel-mark" />
            <Badge variant="topic">Topic 1.2</Badge>
            <span>Data representation</span>
          </>
        }
        title="Text, sound and images"
        description="One idea: everything becomes binary. Type a character, sample a sound, or build an image — then change one thing and explain what happens."
        breadcrumbs={[
          { label: 'Topic 1 · Data representation' },
          { label: '1.2 Text, sound and images' },
        ]}
      />
      <section
        className="chapter-studios chapter-studios--four"
        aria-label="Topic 1.2 studios"
      >
        {studioDemos.map((demo) => {
          const Icon = icons[demo.id];
          return (
            <Link
              key={demo.id}
              to={demo.route}
              className={`chapter-studio chapter-studio--${demo.id}`}
              aria-label={`Open lab: Open ${demo.title}`}
            >
              <div className="studio-row">
                <Icon size={24} />
                <LiveBadge />
              </div>
              <div className="chapter-preview" aria-hidden="true">
                {demo.id === 'utf16' ? (
                  <>
                    <strong lang="zh">8F93 → 输</strong>
                    <code>HEX → UTF-16 → TEXT</code>
                  </>
                ) : demo.id === 'text' ? (
                  <>
                    <strong>A → 65</strong>
                    <code>1 0 0 0 0 0 1</code>
                  </>
                ) : demo.id === 'sound' || demo.id === 'sound-journey' ? (
                  <>
                    <svg viewBox="0 0 300 100">
                      <path
                        d={Array.from(
                          { length: 101 },
                          (_, i) =>
                            `${i ? 'L' : 'M'}${i * 3},${50 + Math.sin(i * 0.2) * 32}`,
                        ).join(' ')}
                        fill="none"
                        stroke="#5949cc"
                        strokeWidth="3"
                      />
                      {Array.from({ length: 21 }, (_, i) => (
                        <g key={i}>
                          <line
                            x1={i * 15}
                            x2={i * 15}
                            y1="50"
                            y2={50 + Math.sin(i) * 32}
                            stroke="#5949cc"
                          />
                          <circle
                            cx={i * 15}
                            cy={50 + Math.sin(i) * 32}
                            r="4"
                            fill="#11140f"
                          />
                        </g>
                      ))}
                    </svg>
                    <code>WAVE → SAMPLE → BITS</code>
                  </>
                ) : (
                  <img
                    src={`${import.meta.env.BASE_URL}assets/mona-lisa-beads.png`}
                    alt=""
                  />
                )}
              </div>
              <h2>{demo.title}</h2>
              <p>{demo.description}</p>
              <ul
                className="module-knowledge-tags"
                aria-label="Concepts covered"
              >
                {demo.concepts.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <span className="chapter-studio-cta">
                Open lab
                <ArrowRight size={18} />
              </span>
            </Link>
          );
        })}
      </section>
      <aside className="exam-language-card" aria-labelledby="exam-ready-title">
        <span id="exam-ready-title">Exam-ready idea</span>
        <p>
          Computers represent text, sound and images as binary. The
          representation determines what can be stored, its accuracy and how
          much data is needed.
        </p>
      </aside>
    </main>
  );
}
