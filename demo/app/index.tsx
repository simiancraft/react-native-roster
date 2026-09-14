import { Link } from 'expo-router';
import { GalleryHomeScreen } from '../components/gallery/home';
import type { LinkInput } from '../components/gallery/home/home.types';

export default function HomeRoute() {
  return (
    <GalleryHomeScreen
      attendanceZone={
        <Link
          href="/attendance"
          className="rounded-xl border border-border bg-card p-5 text-lg font-semibold text-foreground"
        >
          Attendance: planned time and real overlap →
        </Link>
      }
      showcaseHref="/showcase"
      fixtureHref={(id) => `/gallery/${id}`}
      linkComponent={GalleryLink}
    />
  );
}

function GalleryLink({ href, cardZone }: LinkInput) {
  return (
    <Link href={href} asChild>
      {cardZone}
    </Link>
  );
}
