import { type ReactNode, useEffect, useId, useState } from 'react';
import { BackHandler, ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Portal, PortalHost } from '../primitives/portal';
import type { SelectionSurfaceProps } from './selection-layout.types';

const overlay = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

/** Native selection presentation with a local portal destination and shared offset translation. */
export function SelectionSurface({
  anchorZone,
  contentZone,
  targetBounds,
  open,
  onDismiss,
  portalHost,
  offsets,
}: SelectionSurfaceProps) {
  const name = useId();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [content, setContent] = useState({ width: 0, height: 0 });
  const maxWidth = Math.max(0, viewport.width - 8);
  const maxHeight = Math.max(0, viewport.height - 8);
  const size = { maxWidth, maxHeight, flexShrink: 1 };
  const { x, y } = offsets;
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
  let detailZone: ReactNode = null;
  if (open && targetBounds && maxWidth > 0 && maxHeight > 0) {
    detailZone = (
      <Portal hostName={portalHost} name={name}>
        <Animated.View style={[{ position: 'absolute', maxWidth, maxHeight }, position]}>
          <View
            accessibilityRole="summary"
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
