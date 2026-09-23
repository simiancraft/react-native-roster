import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { AccessibilityInfo, BackHandler, findNodeHandle, ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Portal, PortalHost } from '../../primitives/portal';
import type { SelectionLayoutProps } from './selection-layout.types';

const overlay = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

/** Native selection presentation with a local portal destination and shared scroll translation. */
export function RosterSelectionPopover({
  anchorZone,
  contentZone,
  targetBounds,
  open,
  returnFocusTarget,
  onDismiss,
  portalHost,
  scroll,
}: SelectionLayoutProps) {
  const name = useId();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [content, setContent] = useState({ width: 0, height: 0 });
  const detailRef = useRef<View | null>(null);
  const focusInput = useRef({ open });
  focusInput.current = { open };
  const [setDetailRef] = useState(() => (node: View | null) => {
    detailRef.current = node;
    if (node && focusInput.current.open) focusAccessibility(node);
  });
  const restoreRef = useRef<SelectionLayoutProps['returnFocusTarget']>(undefined);
  const wasOpen = useRef(false);
  const maxWidth = Math.max(0, viewport.width - 8);
  const maxHeight = Math.max(0, viewport.height - 8);
  const size = { maxWidth, maxHeight, flexShrink: 1 };
  const { x, y } = scroll;
  const position = useAnimatedStyle(() => {
    const below = targetBounds ? targetBounds.y + targetBounds.height + 4 - y.get() : 0;
    const above = targetBounds ? targetBounds.y - content.height - 4 - y.get() : 0;
    const maxTop = Math.max(0, viewport.height - content.height);
    return {
      left: Math.max(0, Math.min((targetBounds?.x ?? 0) - x.get(), viewport.width - content.width)),
      top: below >= 0 && below <= maxTop ? below : above >= 0 && above <= maxTop ? above : 0,
    };
  }, [targetBounds, content, viewport, x, y]);
  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss();
      return true;
    });
    return () => subscription.remove();
  }, [open, onDismiss]);
  useEffect(() => {
    if (open) {
      restoreRef.current = returnFocusTarget;
      focusAccessibility(detailRef.current);
    } else if (wasOpen.current) {
      focusAccessibility(restoreRef.current?.current);
      restoreRef.current = undefined;
    }
    wasOpen.current = open;
  }, [open, returnFocusTarget]);
  let detailZone: ReactNode = null;
  if (open && targetBounds && maxWidth > 0 && maxHeight > 0) {
    detailZone = (
      <Portal hostName={portalHost} name={name}>
        <Animated.View style={[{ position: 'absolute', maxWidth, maxHeight }, position]}>
          <View
            ref={setDetailRef}
            accessibilityRole="summary"
            accessibilityLabel="Interval details"
            onStartShouldSetResponder={() => true}
            style={size}
            onLayout={({ nativeEvent }) =>
              setContent({
                width: nativeEvent.layout.width,
                height: nativeEvent.layout.height,
              })
            }
          >
            <ScrollView style={size} nestedScrollEnabled>
              <ScrollView
                horizontal
                style={{ maxWidth, flexGrow: 0, flexShrink: 0 }}
                nestedScrollEnabled
              >
                {contentZone}
              </ScrollView>
            </ScrollView>
          </View>
        </Animated.View>
      </Portal>
    );
  }
  return (
    <View
      style={{ flex: 1, minHeight: 0 }}
      onLayout={({ nativeEvent }) =>
        setViewport({
          width: nativeEvent.layout.width,
          height: nativeEvent.layout.height,
        })
      }
    >
      {anchorZone}
      <View pointerEvents="box-none" style={overlay}>
        <PortalHost name={portalHost} />
      </View>
      {detailZone}
    </View>
  );
}

function focusAccessibility(target: unknown): void {
  if (target === null || target === undefined) return;
  const handle = typeof target === 'number' ? target : findNodeHandle(target as View);
  if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
}
