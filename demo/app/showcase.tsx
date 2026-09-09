import { Link } from 'expo-router';
import { TeamRosterScreen } from '../components/team-roster';

// The route shell owns router contact; the screen receives the link as a zone.
export default function ShowcaseRoute() {
  return (
    <TeamRosterScreen
      backZone={
        <Link href="/" className="text-xs font-medium text-muted-foreground">
          ← Gallery
        </Link>
      }
    />
  );
}
