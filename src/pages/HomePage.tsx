import { useEffect } from 'react';
import { ArrowRight, Binary, BookOpen, Boxes, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { ComingSoonBadge, LiveBadge } from '@/src/components/AppShell';
import { PageHeader } from '@/src/components/PageHeader';
import { syllabus } from '@/src/data/syllabus';

export function HomePage() {
  useEffect(() => {
    document.title = 'Gregg’s IGCSE CS Playground';
  }, []);
  return (
    <main className="page-wrap catalogue-page">
      <PageHeader
        eyebrow={
          <>
            <BookOpen /> Interactive curriculum
          </>
        }
        title="Learn computer science by changing things."
        description="A growing collection of hands-on demonstrations for Cambridge IGCSE Computer Science 0478. Open a live lab, make a prediction, and see the concept respond."
      />

      <section className="featured-lab" aria-labelledby="featured-title">
        <div className="featured-copy">
          <LiveBadge />
          <p className="section-kicker">Topic 1.2 · Image representation</p>
          <h2 id="featured-title">Turn the Mona Lisa into pixels.</h2>
          <p>
            Explore how image resolution and colour depth change detail,
            available colours and theoretical file size—one bead at a time.
          </p>
          <Link
            to="/topics/1-data-representation/1-2-text-sound-images/pixel-bead-simulator"
            className={buttonVariants({
              size: 'lg',
              className: 'featured-button',
            })}
          >
            Open Pixel Bead Simulator <ArrowRight />
          </Link>
        </div>
        <div className="featured-visual" aria-hidden="true">
          <img
            src={`${import.meta.env.BASE_URL}assets/mona-lisa-beads.png`}
            alt=""
          />
          <div className="featured-stat">
            <span>Default lab</span>
            <strong>32 × 32 · 4 bpp</strong>
          </div>
        </div>
      </section>

      {[1, 2].map((paper) => (
        <section
          className="topic-section"
          key={paper}
          aria-labelledby={`paper-${paper}-title`}
        >
          <div className="section-heading-row">
            <div>
              <p className="section-kicker">Syllabus map</p>
              <h2 id={`paper-${paper}-title`}>Paper {paper}</h2>
            </div>
            <Badge variant="secondary">
              {paper === 1
                ? 'Computer Systems'
                : 'Algorithms, Programming and Logic'}
            </Badge>
          </div>
          <div className="topic-grid">
            {syllabus
              .filter((topic) => topic.paper === paper)
              .map((topic) => {
                const isLive = topic.sections.some(
                  (section) => section.status === 'live',
                );
                return (
                  <Card
                    key={topic.number}
                    className={
                      isLive ? 'topic-card topic-card-live' : 'topic-card'
                    }
                  >
                    <CardHeader>
                      <div className="topic-card-number">
                        {String(topic.number).padStart(2, '0')}
                      </div>
                      <CardTitle>{topic.title}</CardTitle>
                      <CardDescription>
                        {topic.sections.length
                          ? `${topic.sections.length} syllabus sections`
                          : 'Core syllabus topic'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="topic-section-list">
                      {topic.sections.slice(0, 3).map((section) => (
                        <span key={section.id}>
                          <b>{section.id}</b>
                          {section.title}
                        </span>
                      ))}
                      {topic.sections.length > 3 && (
                        <span className="more-sections">
                          + {topic.sections.length - 3} more
                        </span>
                      )}
                    </CardContent>
                    <CardFooter>
                      {isLive ? (
                        <Link
                          className="card-link"
                          to={
                            topic.sections.find(
                              (section) => section.status === 'live',
                            )?.route ?? '/'
                          }
                        >
                          Explore topic <ArrowRight />
                        </Link>
                      ) : (
                        <ComingSoonBadge />
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
          </div>
        </section>
      ))}

      <section
        className="learning-principles"
        aria-label="How to use this playground"
      >
        <div>
          <Binary />
          <strong>Predict</strong>
          <span>Say what you expect before moving a control.</span>
        </div>
        <div>
          <Radio />
          <strong>Observe</strong>
          <span>Change one variable and watch the evidence.</span>
        </div>
        <div>
          <Boxes />
          <strong>Explain</strong>
          <span>Use the live numbers to justify what changed.</span>
        </div>
      </section>
    </main>
  );
}
