import { Text } from 'react-native';

/** Discloses that the people on screen are generated, not an export of anyone. */
export function GeneratedNote() {
  return (
    <Text className="text-[11px] text-muted-foreground">
      Names, titles, and the organization are generated with @faker-js/faker from a fixed seed; any
      resemblance to real people is coincidental.
    </Text>
  );
}
