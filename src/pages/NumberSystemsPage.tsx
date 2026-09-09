import { useEffect } from 'react';
import { ArrowRight, Binary, ScanLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { LiveBadge } from '../components/AppShell';
import { numberDemos } from '../data/syllabus';
import '../studio.css';
import '../hex.css';

export function NumberSystemsPage() {
  useEffect(() => {
    document.title = '1.1 Number systems · Gregg’s Playground';
  }, []);
  return (
    <main className="page-wrap section-page">
      <PageHeader
        variant="section"
        eyebrow="0478 / 1.1 · Data representation"
        title="Number systems"
        description="Same value. Different notation. Explore where hexadecimal appears and why people use it to work with binary data."
        breadcrumbs={[
          { label: 'Topic 1 · Data representation' },
          { label: '1.1 Number systems' },
        ]}
      />
      <section
        className="chapter-studios chapter-studios--four"
        aria-label="Topic 1.1 studios"
      >
        {numberDemos.map((demo, index) => (
          <Link
            key={demo.id}
            to={demo.route}
            className="chapter-studio chapter-studio--hex"
            aria-label={`Open ${demo.title}`}
          >
            <div className="studio-row">
              {index === 0 ? <ScanLine /> : <Binary />}
              <LiveBadge />
            </div>
            <div className="chapter-preview hex-preview" aria-hidden="true">
              <strong>{index === 0 ? '#B9F24C' : '1111 → F'}</strong>
              <code>
                {index === 0
                  ? 'ERROR · COLOUR · MAC · IPv6'
                  : 'FOUR BITS. ONE HEX DIGIT.'}
              </code>
            </div>
            <h2>{demo.title}</h2>
            <p>{demo.description}</p>
            <ul className="module-knowledge-tags">
              {demo.concepts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <span className="chapter-studio-cta">
              Open lab <ArrowRight size={18} />
            </span>
          </Link>
        ))}
      </section>
      <aside className="exam-language-card">
        <span>Exam-ready idea</span>
        <p>
          Hexadecimal is base 16: digits 0–9 and A–F. Each hexadecimal digit
          corresponds to exactly four binary digits. A shorter representation
          does not mean less underlying data.
        </p>
      </aside>
    </main>
  );
}
