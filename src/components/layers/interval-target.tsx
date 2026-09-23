import { Fragment, useRef } from 'react';
import { Pressable, type View } from 'react-native';
import type { IntervalTargetInput } from './interval-target.types';
import { intervalTargetLabel } from './interval-target-label';

export function IntervalTarget(input: IntervalTargetInput) {
  const target = useRef<View>(null);
  const { children, rect, onActivate, onPoint } = input;
  function activate() {
    onActivate(target);
  }
  return (
    <Fragment>
      {children}
      <Pressable
        ref={target}
        accessibilityRole="button"
        accessibilityLabel={intervalTargetLabel(input)}
        onAccessibilityTap={activate}
        onPress={(event) => {
          event.stopPropagation();
          const { locationX, locationY } = event.nativeEvent ?? {};
          if (Number.isFinite(locationX) && Number.isFinite(locationY)) {
            onPoint(rect.x + locationX, rect.y + locationY);
          } else {
            activate();
          }
        }}
        style={{
          position: 'absolute',
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          zIndex: rect.z,
        }}
      />
    </Fragment>
  );
}
