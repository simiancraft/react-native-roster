import { Link } from 'expo-router';
import { GalleryHomeScreen } from '../components/gallery/home';

export default function HomeRoute() {
  return (
    <GalleryHomeScreen
      showcaseHref="/showcase"
      fixtureHref={(id) => `/gallery/${id}`}
      linkZone={({ href, children }) => (
        <Link href={href} asChild>
          {children}
        </Link>
      )}
    />
  );
}
