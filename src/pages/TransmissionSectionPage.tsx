import { useEffect } from 'react';
import { ArrowRight, Cable } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LiveBadge } from '../components/AppShell';
import { PageHeader } from '../components/PageHeader';
import { transmissionDemos } from '../data/syllabus';
import '../studio.css';
import '../transmission.css';

export function TransmissionSectionPage() {
  useEffect(() => {
    document.title =
      '2.1 Types and methods of data transmission · Gregg’s Playground';
  }, []);

  return (
    <main className="page-wrap section-page">
      <PageHeader
        variant="section"
        eyebrow="0478 / 2.1 · Data transmission"
        title="Types and methods of data transmission"
        description="One bit or many? One way or both? Make the connection."
        breadcrumbs={[
          { label: 'Topic 2 · Data transmission' },
          { label: '2.1 Types and methods' },
        ]}
      />
      <section
        className="transmission-launch-grid"
        aria-label="Topic 2.1 studios"
      >
        {transmissionDemos.map((demo) => (
          <Link
            key={demo.id}
            to={demo.route}
            className="chapter-studio transmission-launch-card"
            aria-label={`Open ${demo.title}`}
          >
            <div className="studio-row">
              <Cable aria-hidden="true" />
              <LiveBadge />
            </div>
            <div className="transmission-launch-preview" aria-hidden="true">
              <span>ONE CONNECTION. SIX COMBINATIONS.</span>
              <svg viewBox="0 0 640 190" fill="none">
                <rect x="16" y="39" width="82" height="114" rx="16" />
                <rect x="542" y="39" width="82" height="114" rx="16" />
                <text x="57" y="102" textAnchor="middle">
                  A
                </text>
                <text x="583" y="102" textAnchor="middle">
                  B
                </text>
                {[58, 84, 110, 136].map((y, index) => (
                  <g key={y}>
                    <path d={`M 98 ${y} H 542`} />
                    <path d={`m 532 ${y - 5} 10 5 -10 5`} />
                    <rect
                      className="transmission-launch-bit"
                      x={176 + index * 62}
                      y={y - 11}
                      width="28"
                      height="22"
                      rx="5"
                    />
                    <text
                      className="transmission-launch-bit-label"
                      x={190 + index * 62}
                      y={y + 5}
                      textAnchor="middle"
                    >
                      {index % 2 === 0 ? '1' : '0'}
                    </text>
                  </g>
                ))}
              </svg>
              <code>Serial / Parallel × Simplex / Half / Full-duplex</code>
            </div>
            <h2>{demo.title}</h2>
            <p>{demo.description}</p>
            <ul className="module-knowledge-tags" aria-label="Concepts covered">
              {demo.concepts.map((concept) => (
                <li key={concept}>{concept}</li>
              ))}
            </ul>
            <span className="chapter-studio-cta">
              Open lab <ArrowRight size={18} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
