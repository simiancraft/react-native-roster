import type { RefAttributes } from 'react';
import type { View } from 'react-native';
import type { LabelWheelProps } from './label-wheel.types';

export function labelWheelProps({ verticalRef }: LabelWheelProps): RefAttributes<View> {
  let node: HTMLElement | null;
  return {
    ref: (ref: View | null) => {
      if (node) node.onwheel = null;
      node = ref as unknown as HTMLElement | null;
      if (!node) return;
      node.onwheel = (input) => {
        const { deltaY, deltaMode } = input;
        const target = verticalRef.current?.getScrollableNode() as HTMLElement | undefined;
        if (!target || input.ctrlKey || !deltaY) return;
        // Wheel lines use a 16 px step; pages use the list viewport.
        const scale = deltaMode === 1 ? 16 : deltaMode === 2 ? target.clientHeight : 1;
        const previous = target.scrollTop;
        target.scrollTop += deltaY * scale;
        if (target.scrollTop !== previous) input.preventDefault();
      };
    },
  };
}
