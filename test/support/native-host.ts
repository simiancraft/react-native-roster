import { mock } from 'bun:test';
import { createElement, type ReactNode, useRef } from 'react';

export const backHandlers = new Set<() => boolean>();
export const testPlatform = { OS: 'ios' };
export const accessibilityFocus = mock((_handle: number) => {});

// Native hosts are supplied by the app runtime, which Bun does not implement.
mock.module('react-native', () => ({
  AccessibilityInfo: { setAccessibilityFocus: accessibilityFocus },
  BackHandler: {
    addEventListener: (_name: string, handler: () => boolean) => {
      backHandlers.add(handler);
      return { remove: () => backHandlers.delete(handler) };
    },
  },
  Linking: { openURL: async () => true },
  Platform: testPlatform,
  findNodeHandle: (target: unknown) => (target as { nativeTag?: number } | null)?.nativeTag ?? null,
  View: 'View',
  Text: 'Text',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
}));
mock.module('react-native-reanimated', () => ({
  default: { View: 'AnimatedView' },
  makeMutable(initial: number) {
    let value = initial;
    return {
      get value() {
        return value;
      },
      set value(next: number) {
        value = next;
      },
      get: () => value,
      set: (next: number) => {
        value = next;
      },
    };
  },
  useAnimatedStyle: (updater: () => unknown) => updater(),
}));
mock.module('@legendapp/list', () => ({
  LegendList: function LegendList(props: {
    data: unknown[];
    extraData?: unknown;
    renderItem: (input: { item: unknown; index: number }) => ReactNode;
  }) {
    // Retain rows by lane identity and content key, matching LegendList's update boundary.
    const retained = useRef<{ item: unknown; key: unknown; node: ReactNode }[]>([]);
    const rows = props.data.slice(0, 24).map((item, index) => {
      const previous = retained.current[index];
      if (previous && previous.item === item && previous.key === props.extraData) return previous;
      return {
        item,
        key: props.extraData,
        node: createElement('MountedLane', { key: index }, props.renderItem({ item, index })),
      };
    });
    retained.current = rows;
    return createElement(
      'LegendList',
      props,
      rows.map(({ node }) => node),
    );
  },
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: true });
