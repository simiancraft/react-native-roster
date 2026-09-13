import { Link } from 'expo-router';
import { GalleryHomeScreen } from '../components/gallery/home';
import type { LinkInput } from '../components/gallery/home/home.types';

export default function HomeRoute() {
  return (
    <GalleryHomeScreen
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
