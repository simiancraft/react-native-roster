import { useEffect, useId, useState } from 'react';
import { BackHandler, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Portal, PortalHost } from '../../primitives/portal';
import type { SelectionLayoutProps } from './selection-layout.types';

/** Native selection presentation with a local portal destination and shared scroll translation. */
export function RosterSelectionPopover({
  anchorZone,
  contentZone,
  anchor,
  open,
  onDismiss,
  portalHost,
  scroll,
}: SelectionLayoutProps) {
  const name = useId();
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const { x, y } = scroll;
  const position = useAnimatedStyle(() => {
    const top = anchor ? anchor.y + anchor.height + 4 : 0;
    const flip = top - y.get() + contentHeight > viewportHeight;
    return {
      left: anchor?.x ?? 0,
      top: flip && anchor ? anchor.y - contentHeight - 4 : top,
      transform: [{ translateX: -x.get() }, { translateY: -y.get() }],
    };
  });
  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onDismiss();
      return true;
    });
    return () => subscription.remove();
  }, [open, onDismiss]);
  return (
    <View
      style={{ flex: 1, minHeight: 0 }}
      onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
    >
      {anchorZone}
      <View pointerEvents="box-none" style={overlay}>
        <PortalHost name={portalHost} />
      </View>
      {open && anchor ? (
        <Portal hostName={portalHost} name={name}>
          <Pressable
            accessibilityLabel="Dismiss interval details"
            style={overlay}
            onPress={onDismiss}
          />
          <Animated.View style={[{ position: 'absolute' }, position]}>
            <View
              accessibilityRole="summary"
              onLayout={({ nativeEvent }) => setContentHeight(nativeEvent.layout.height)}
            >
              {contentZone}
            </View>
          </Animated.View>
        </Portal>
      ) : null}
    </View>
  );
}
const overlay = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;
