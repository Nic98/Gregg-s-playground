import { useEffect } from 'react';
import { ArrowRight, FileText, Image as ImageIcon, Music2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ComingSoonBadge, LiveBadge } from '@/src/components/AppShell';
import { PageHeader } from '@/src/components/PageHeader';
import { PixelMark } from '@/src/components/PixelMark';
import { simulatorRoute } from '@/src/data/syllabus';

const plannedModules = [
  {
    title: 'Text',
    description: 'Character sets, ASCII, Unicode and bits per character.',
    icon: FileText,
    accent: 'coral',
  },
  {
    title: 'Sound',
    description: 'Sample rate, sample resolution, accuracy and file size.',
    icon: Music2,
    accent: 'violet',
  },
] as const;

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
        description="Computers represent every kind of media as binary. Choose a studio to explore how that conversion works and why each setting matters."
        breadcrumbs={[
          { label: 'Topic 1 · Data representation' },
          { label: '1.2 Text, sound and images' },
        ]}
      />

      <section
        className="module-grid module-bento"
        aria-label="Topic 1.2 studios"
      >
        <Link
          to={simulatorRoute}
          className="module-card module-card-live module-feature-link"
          aria-label="Open lab: Open Pixel Bead Simulator"
        >
          <div className="module-feature-link__heading">
            <span className="module-icon module-icon--images">
              <ImageIcon aria-hidden="true" />
            </span>
            <LiveBadge />
          </div>

          <div className="module-feature-link__copy">
            <p className="section-kicker">Image representation</p>
            <h2>See an image become data.</h2>
            <p>
              Rebuild a familiar portrait bead by bead. Compare the source with
              its bitmap while resolution, colour depth and raw size update in
              real time.
            </p>
            <ul className="module-knowledge-tags" aria-label="Concepts covered">
              <li>Pixels</li>
              <li>Resolution</li>
              <li>Colour depth</li>
            </ul>
          </div>

          <figure className="module-feature-link__preview">
            <img
              src={`${import.meta.env.BASE_URL}assets/mona-lisa-beads.png`}
              alt="Mona Lisa rendered as a grid of coloured beads"
            />
            <figcaption>
              <span>Pixel Bead Simulator</span>
              <strong>32 × 32 · 4 bpp</strong>
            </figcaption>
          </figure>

          <span className="module-feature-link__cta">
            Open Pixel Bead Simulator <ArrowRight aria-hidden="true" />
          </span>
        </Link>

        <div className="module-bento__planned">
          {plannedModules.map((module) => (
            <article
              className={`module-card module-planned-card module-planned-card--${module.accent}`}
              key={module.title}
            >
              <div className="module-planned-card__heading">
                <span className="module-icon">
                  <module.icon aria-hidden="true" />
                </span>
                <ComingSoonBadge />
              </div>
              <div className="module-planned-card__copy">
                <h2>{module.title}</h2>
                <p>{module.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="exam-language-card" aria-labelledby="exam-ready-title">
        <span id="exam-ready-title">Exam-ready idea</span>
        <p>
          An image is a series of pixels converted into binary so it can be
          processed by a computer.
        </p>
      </aside>
    </main>
  );
}
