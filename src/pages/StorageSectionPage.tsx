import { useEffect } from 'react';
import { ArrowRight, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { LiveBadge } from '../components/AppShell';
import { storageDemos } from '../data/syllabus';
import '../studio.css';
import '../memory.css';

export function StorageSectionPage() {
  useEffect(() => {
    document.title = '1.3 Data storage and compression · Gregg’s Playground';
  }, []);
  return (
    <main className="page-wrap section-page">
      <PageHeader
        variant="section"
        eyebrow="0478 / 1.3 · Data representation"
        title="Data storage and compression"
        description="Small bits. Big numbers. Explore the units behind storage."
        breadcrumbs={[
          { label: 'Topic 1 · Data representation' },
          { label: '1.3 Data storage and compression' },
        ]}
      />
      <section className="memory-launch-grid" aria-label="Topic 1.3 studios">
        {storageDemos.map((demo) => (
          <Link
            className="chapter-studio memory-launch-card"
            key={demo.id}
            to={demo.route}
            aria-label={`Open ${demo.title}`}
          >
            <div className="studio-row">
              <HardDrive />
              <LiveBadge />
            </div>
            <div className="memory-launch-preview" aria-hidden="true">
              <span>ONE STEP. TWO SYSTEMS.</span>
              <div>
                <strong>1,000</strong>
                <span>vs</span>
                <strong>1,024</strong>
              </div>
              <code>b → B → KiB → MiB → … → EiB</code>
            </div>
            <h2>{demo.title}</h2>
            <p>{demo.description}</p>
            <ul className="module-knowledge-tags" aria-label="Concepts covered">
              {demo.concepts.map((concept) => (
                <li key={concept}>{concept}</li>
              ))}
            </ul>
            <span className="chapter-studio-cta">
              Open lab <ArrowRight size={18} />
            </span>
          </Link>
        ))}
        <aside className="memory-planned">
          <span className="studio-kicker">On the workbench</span>
          <h2>Compression</h2>
          <p>More experiments to come.</p>
        </aside>
      </section>
    </main>
  );
}
