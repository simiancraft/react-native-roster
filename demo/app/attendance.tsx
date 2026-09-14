import { Link } from 'expo-router';
import { attendanceFixtures } from '../../test/fixtures/attendance';
import { AttendanceScreen } from '../components/attendance/screen';

export default function AttendanceRoute() {
  return (
    <AttendanceScreen
      attendances={attendanceFixtures}
      homeZone={
        <Link href="/" className="text-xs font-medium text-muted-foreground">
          ← Gallery
        </Link>
      }
    />
  );
}
