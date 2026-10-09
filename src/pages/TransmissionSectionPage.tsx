import { useEffect } from 'react';
import { ArrowRight, Cable, Network } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LiveBadge } from '../components/AppShell';
import { PageHeader } from '../components/PageHeader';
import { transmissionDemos } from '../data/syllabus';
import '../studio.css';
import '../transmission.css';

function TransmissionPreview() {
  return (
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
  );
}

function PacketSwitchingPreview() {
  return (
    <div
      className="transmission-launch-preview packet-launch-preview"
      aria-hidden="true"
    >
      <span>ONE EMAIL. FOUR PACKETS. EIGHT STEPS.</span>
      <svg viewBox="0 0 640 190" fill="none">
        <path d="M 80 96 H 176 L 320 34 L 464 96 H 560 M 176 96 L 320 158 L 464 96" />
        <rect x="16" y="65" width="64" height="62" rx="14" />
        <path d="m 28 84 20 16 20-16 M 28 84 H 68 V 110 H 28 Z" />
        <rect x="560" y="65" width="64" height="62" rx="14" />
        <path d="m 574 98 12 12 25-29" />
        {[
          [176, 96],
          [320, 34],
          [320, 158],
          [464, 96],
        ].map(([x, y], index) => (
          <g key={index}>
            <circle cx={x} cy={y} r="21" />
            <text
              className="packet-launch-router"
              x={x}
              y={y + 5}
              textAnchor="middle"
            >
              R{index + 1}
            </text>
          </g>
        ))}
        {[
          [247, 57, 2],
          [385, 124, 1],
          [506, 84, 4],
          [240, 113, 3],
        ].map(([x, y, number]) => (
          <g key={number}>
            <rect
              className="transmission-launch-bit"
              x={x}
              y={y}
              width="30"
              height="24"
              rx="5"
            />
            <text
              className="transmission-launch-bit-label"
              x={x + 15}
              y={y + 17}
              textAnchor="middle"
            >
              {number}
            </text>
          </g>
        ))}
      </svg>
      <code>Split → Route → Check → Reassemble</code>
    </div>
  );
}

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
        description="Make a connection. Send the bits. Follow an email across the network."
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
              {demo.id === 'packet-switching' ? (
                <Network aria-hidden="true" />
              ) : (
                <Cable aria-hidden="true" />
              )}
              <LiveBadge />
            </div>
            {demo.id === 'packet-switching' ? (
              <PacketSwitchingPreview />
            ) : (
              <TransmissionPreview />
            )}
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
