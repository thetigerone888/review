// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for FeedbackIQ
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "doc.text.fill": "description",
  "chart.bar.fill": "bar-chart",
  "gearshape.fill": "settings",
  // Actions
  "paperplane.fill": "send",
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "pencil": "edit",
  "trash": "delete",
  "trash.fill": "delete",
  "square.and.arrow.up": "share",
  "square.and.arrow.up.fill": "share",
  "doc.on.doc": "content-copy",
  "checkmark": "check",
  "checkmark.circle.fill": "check-circle",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  // Content
  "star.fill": "star",
  "star": "star-outline",
  "heart.fill": "favorite",
  "bubble.left.fill": "chat-bubble",
  "person.fill": "person",
  "tag.fill": "label",
  "tag": "label-outline",
  "magnifyingglass": "search",
  "bell.fill": "notifications",
  "bell": "notifications-none",
  "qrcode": "qr-code",
  "link": "link",
  "arrow.down.to.line": "download",
  "arrow.up.from.line": "upload",
  "clock.fill": "access-time",
  "calendar": "calendar-today",
  "chart.pie.fill": "pie-chart",
  "chart.line.uptrend.xyaxis": "trending-up",
  "arrow.clockwise": "refresh",
  "info.circle": "info",
  "info.circle.fill": "info",
  "exclamationmark.triangle.fill": "warning",
  "eye": "visibility",
  "eye.slash": "visibility-off",
  "ellipsis": "more-horiz",
  "ellipsis.circle": "more-horiz",
  "slider.horizontal.3": "tune",
  "line.3.horizontal.decrease": "filter-list",
  "arrow.right": "arrow-forward",
  "arrow.left": "arrow-back",
  "face.smiling": "sentiment-satisfied",
  "face.smiling.fill": "sentiment-satisfied-alt",
  "hand.thumbsup.fill": "thumb-up",
  "hand.thumbsdown.fill": "thumb-down",
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
