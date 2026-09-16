import { Anchor, Content, Portal, Root } from '@radix-ui/react-popover';
import { useEffect, useRef } from 'react';
import Animated from 'react-native-reanimated';
import type { SelectionLayoutProps } from './selection-layout.types';

/** Web selection presentation; Radix owns outside press, Escape, and collisions. */
export function RosterSelectionPopover({
  anchorZone,
  contentZone,
  targetBounds,
  open,
  onDismiss,
  scroll,
}: SelectionLayoutProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<Element | null>(null);
  const keyboardDismissRef = useRef(false);
  useEffect(() => {
    if (open && targetBounds && bodyRef.current?.contains(document.activeElement)) {
      returnFocusRef.current = document.activeElement;
    }
  }, [open, targetBounds]);
  return (
    <Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
    >
      <div
        ref={bodyRef}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
        }}
      >
        {anchorZone}
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0 }, scroll.headerStyle]}>
          <Animated.View style={scroll.labelStyle}>
            <Anchor asChild>
              <div
                data-testid="roster-selection-target"
                style={{
                  position: 'absolute',
                  left: targetBounds?.x ?? 0,
                  top: targetBounds ? targetBounds.y + targetBounds.height : 0,
                  width: 0,
                  height: 0,
                  pointerEvents: 'none',
                }}
              />
            </Anchor>
          </Animated.View>
        </Animated.View>
      </div>
      <Portal>
        <Content
          onOpenAutoFocus={() => {
            returnFocusRef.current = document.activeElement;
            keyboardDismissRef.current = false;
          }}
          onEscapeKeyDown={() => {
            keyboardDismissRef.current = true;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (keyboardDismissRef.current && returnFocusRef.current instanceof HTMLElement) {
              returnFocusRef.current.focus({ preventScroll: true });
            }
          }}
          onInteractOutside={(event) => {
            if (bodyRef.current?.contains(event.target as Node)) event.preventDefault();
          }}
          sideOffset={4}
          align="start"
          updatePositionStrategy="always"
          aria-label="Interval details"
          style={{ zIndex: 1000 }}
        >
          {contentZone}
        </Content>
      </Portal>
    </Root>
  );
}
