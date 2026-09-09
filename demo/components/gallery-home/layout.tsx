import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

type GalleryHomeLayoutProps = {
  /** Package name, tagline, and the showcase call to action. */
  heroZone: ReactNode;
  /** One section per fixture family, each a grid of route cards. */
  sectionsZone: ReactNode;
  /** Build identity line. */
  footerZone: ReactNode;
};

export function GalleryHomeLayout({ heroZone, sectionsZone, footerZone }: GalleryHomeLayoutProps) {
  return (
    <ScrollView className="flex-1 bg-zinc-950" contentContainerClassName="items-center px-5 py-10">
      <View className="w-full max-w-[1100px] gap-10">
        {heroZone}
        {sectionsZone}
        {footerZone}
      </View>
    </ScrollView>
  );
}
