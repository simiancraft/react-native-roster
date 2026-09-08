import { mock } from 'bun:test';
import { createElement, type ReactNode } from 'react';

// Native hosts are supplied by the app runtime, which Bun does not implement.
mock.module('react-native', () => ({
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
  LegendList: (props: {
    data: unknown[];
    renderItem: (input: { item: unknown; index: number }) => ReactNode;
  }) =>
    createElement(
      'LegendList',
      props,
      props.data
        .slice(0, 24)
        .map((item, index) =>
          createElement('MountedLane', { key: index }, props.renderItem({ item, index })),
        ),
    ),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
