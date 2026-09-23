import { Fragment, useRef } from 'react';
import type { IntervalTargetInput } from './interval-target.types';
import { intervalTargetLabel } from './interval-target-label';

export function IntervalTarget(input: IntervalTargetInput) {
  const target = useRef<HTMLButtonElement>(null);
  const { children, rect, onActivate, onPoint } = input;
  return (
    <Fragment>
      {children}
      <button
        ref={target}
        type="button"
        aria-label={intervalTargetLabel(input)}
        onClick={(event) => {
          event.stopPropagation();
          if (event.detail > 0) {
            onPoint(rect.x + event.nativeEvent.offsetX, rect.y + event.nativeEvent.offsetY);
          } else {
            onActivate(target);
          }
        }}
        style={{
          position: 'absolute',
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          zIndex: rect.z,
          margin: 0,
          padding: 0,
          border: 0,
          background: 'transparent',
          cursor: 'pointer',
        }}
      />
    </Fragment>
  );
}
