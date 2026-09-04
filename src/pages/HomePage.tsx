import { useEffect } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Binary,
  BookOpen,
  Boxes,
  Radio,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ComingSoonBadge, LiveBadge } from '@/src/components/AppShell';
import { PageHeader } from '@/src/components/PageHeader';
import { PixelMark } from '@/src/components/PixelMark';
import {
  sectionRoute,
  simulatorRoute,
  syllabus,
  type SyllabusTopic,
} from '@/src/data/syllabus';

function sectionCount(topic: SyllabusTopic) {
  const count = topic.sections.length;
  return `${count} syllabus ${count === 1 ? 'section' : 'sections'}`;
}

function TopicShowcase({ topic }: { topic: SyllabusTopic }) {
  return (
    <Link
      to={sectionRoute}
      className="topic-card topic-showcase"
      aria-label={`Explore topic ${topic.number}: ${topic.title}`}
    >
      <div className="topic-showcase__meta">
        <Badge variant="topic">
          Topic {String(topic.number).padStart(2, '0')}
        </Badge>
        <LiveBadge />
      </div>
      <div className="topic-showcase__body">
        <div>
          <p className="section-kicker">Paper {topic.paper} showcase</p>
          <h3>{topic.title}</h3>
          <p>
            See how numbers, text, sound and images become binary data. Start
            with the live image-representation atelier in section 1.2.
          </p>
        </div>
        <div className="topic-showcase__lab">
          <span>Featured section</span>
          <strong>1.2 · Text, sound and images</strong>
          <small>{sectionCount(topic)}</small>
        </div>
      </div>
      <span className="topic-showcase__cta">
        Explore topic <ArrowRight aria-hidden="true" />
      </span>
    </Link>
  );
}

function CompactTopicCard({ topic }: { topic: SyllabusTopic }) {
  return (
    <article className="topic-card topic-compact-card">
      <div className="topic-compact-card__number">
        {String(topic.number).padStart(2, '0')}
      </div>
      <div className="topic-compact-card__copy">
        <h3>{topic.title}</h3>
        <span>{sectionCount(topic)}</span>
      </div>
      <ComingSoonBadge />
    </article>
  );
}

export function HomePage() {
  useEffect(() => {
    document.title = 'Gregg’s IGCSE CS Playground';
  }, []);

  const paperOneTopics = syllabus.filter((topic) => topic.paper === 1);
  const paperTwoTopics = syllabus.filter((topic) => topic.paper === 2);
  const featuredTopic = paperOneTopics[0];

  return (
    <main className="page-wrap catalogue-page">
      <section className="editorial-hero" aria-labelledby="catalogue-title">
        <div className="editorial-hero__intro">
          <PixelMark className="section-pixel-mark" />
          <PageHeader
            variant="catalogue"
            titleId="catalogue-title"
            eyebrow={
              <>
                <BookOpen aria-hidden="true" /> Interactive curriculum
              </>
            }
            title="Learn computer science by changing things."
            description="A growing collection of hands-on demonstrations for Cambridge IGCSE Computer Science 0478. Make a prediction, change one variable, and explain what the evidence shows."
          />
          <Link
            to={simulatorRoute}
            className={buttonVariants({
              variant: 'accent',
              size: 'lg',
              className: 'editorial-hero__mobile-cta',
            })}
          >
            Open Pixel Bead Simulator <ArrowRight aria-hidden="true" />
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="editorial-hero__browse"
            onClick={() =>
              document
                .getElementById('course-catalogue')
                ?.scrollIntoView({ block: 'start' })
            }
          >
            Browse the course <ArrowDown aria-hidden="true" />
          </Button>
        </div>

        <article className="hero-lab-card" aria-labelledby="hero-lab-title">
          <div className="hero-lab-card__copy">
            <div className="hero-lab-card__meta">
              <LiveBadge />
              <span>Topic 1.2 · Image representation</span>
            </div>
            <h2 id="hero-lab-title">Turn the Mona Lisa into pixels.</h2>
            <p>
              Change resolution and colour depth, then watch detail, available
              colours and theoretical file size respond.
            </p>
          </div>

          <figure className="hero-lab-card__visual">
            <img
              src={`${import.meta.env.BASE_URL}assets/mona-lisa-beads.png`}
              alt="Mona Lisa rendered as a grid of coloured beads"
            />
            <figcaption>
              <span>Default experiment</span>
              <strong>32 × 32 pixels · 4 bits per pixel</strong>
            </figcaption>
          </figure>

          <Link
            to={simulatorRoute}
            className={buttonVariants({
              variant: 'accent',
              size: 'lg',
              className: 'hero-lab-card__cta',
            })}
          >
            Open Pixel Bead Simulator <ArrowRight aria-hidden="true" />
          </Link>
        </article>
      </section>

      <section
        className="learning-method"
        aria-labelledby="learning-method-title"
      >
        <div className="learning-method__heading">
          <span>Studio method</span>
          <h2 id="learning-method-title">Predict. Observe. Explain.</h2>
        </div>
        <ol className="learning-method__steps">
          <li>
            <Binary aria-hidden="true" />
            <span>
              <strong>Predict</strong>
              Say what you expect before moving a control.
            </span>
          </li>
          <li>
            <Radio aria-hidden="true" />
            <span>
              <strong>Observe</strong>
              Change one variable and watch the evidence.
            </span>
          </li>
          <li>
            <Boxes aria-hidden="true" />
            <span>
              <strong>Explain</strong>
              Use the live numbers to justify what changed.
            </span>
          </li>
        </ol>
      </section>

      <div id="course-catalogue" className="course-catalogue">
        <section className="topic-section" aria-labelledby="paper-1-title">
          <div className="section-heading-row">
            <div>
              <p className="section-kicker">Syllabus catalogue</p>
              <h2 id="paper-1-title">Paper 1</h2>
            </div>
            <Badge variant="topic">Computer Systems</Badge>
          </div>

          <div className="topic-catalogue-group">
            <TopicShowcase topic={featuredTopic} />
            <div className="topic-compact-grid">
              {paperOneTopics.slice(1).map((topic) => (
                <CompactTopicCard key={topic.number} topic={topic} />
              ))}
            </div>
          </div>
        </section>

        <section className="topic-section" aria-labelledby="paper-2-title">
          <div className="section-heading-row">
            <div>
              <p className="section-kicker">Syllabus catalogue</p>
              <h2 id="paper-2-title">Paper 2</h2>
            </div>
            <Badge variant="topic">Algorithms, Programming and Logic</Badge>
          </div>

          <div className="topic-compact-grid topic-compact-grid--paper-two">
            {paperTwoTopics.map((topic) => (
              <CompactTopicCard key={topic.number} topic={topic} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
