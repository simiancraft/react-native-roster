import { Link } from 'expo-router';
import { GalleryHomeScreen } from '../components/gallery/home';

export default function HomeRoute() {
  return (
    <GalleryHomeScreen
      showcaseHref="/showcase"
      fixtureHref={(id) => `/gallery/${id}`}
      linkZone={({ href, cardZone }) => (
        <Link href={href} asChild>
          {cardZone}
        </Link>
      )}
    />
  );
}
