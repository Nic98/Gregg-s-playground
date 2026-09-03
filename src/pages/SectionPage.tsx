import { useEffect } from 'react';
import { ArrowRight, FileText, Image, Music2 } from 'lucide-react';
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
import { simulatorRoute } from '@/src/data/syllabus';

const modules = [
  {
    title: 'Text',
    description: 'Character sets, ASCII, Unicode and bits per character.',
    icon: FileText,
    status: 'coming-soon',
  },
  {
    title: 'Sound',
    description: 'Sample rate, sample resolution, accuracy and file size.',
    icon: Music2,
    status: 'coming-soon',
  },
  {
    title: 'Images',
    description: 'Pixels, image resolution, colour depth and bitmap file size.',
    icon: Image,
    status: 'live',
  },
] as const;

export function SectionPage() {
  useEffect(() => {
    document.title = '1.2 Text, sound and images · Gregg’s Playground';
  }, []);
  return (
    <main className="page-wrap section-page">
      <PageHeader
        eyebrow={
          <>
            <Badge variant="secondary">Topic 1.2</Badge> Data representation
          </>
        }
        title="Text, sound and images"
        description="Computers represent every kind of media as binary. Choose a lab to explore how that conversion works and why the settings matter."
        breadcrumbs={[
          { label: 'Topic 1 · Data representation' },
          { label: '1.2 Text, sound and images' },
        ]}
      />
      <section className="module-grid" aria-label="Topic 1.2 modules">
        {modules.map((module) => (
          <Card
            className={
              module.status === 'live'
                ? 'module-card module-card-live'
                : 'module-card'
            }
            key={module.title}
          >
            <CardHeader>
              <span className="module-icon">
                <module.icon />
              </span>
              <CardTitle>{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {module.status === 'live' ? (
                <div className="module-preview-row">
                  <img
                    src={`${import.meta.env.BASE_URL}assets/mona-lisa-beads.png`}
                    alt="Mona Lisa bead portrait preview"
                  />
                  <span>
                    <strong>Pixel Bead Simulator</strong>
                    <small>Resolution · Colour depth · File size</small>
                  </span>
                </div>
              ) : (
                <p className="module-placeholder">
                  This lab is on the workbench.
                </p>
              )}
            </CardContent>
            <CardFooter>
              {module.status === 'live' ? (
                <>
                  <LiveBadge />
                  <Link
                    to={simulatorRoute}
                    className={buttonVariants({ size: 'lg' })}
                  >
                    Open lab <ArrowRight />
                  </Link>
                </>
              ) : (
                <ComingSoonBadge />
              )}
            </CardFooter>
          </Card>
        ))}
      </section>
      <aside className="exam-language-card">
        <span>Exam-ready idea</span>
        <p>
          An image is a series of pixels converted into binary so it can be
          processed by a computer.
        </p>
      </aside>
    </main>
  );
}
