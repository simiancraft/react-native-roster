import { Link } from 'expo-router';
import { TeamRosterScreen } from '../components/team-roster';

// The route shell owns router contact; the screen owns generated attendance and its demo clock.
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
