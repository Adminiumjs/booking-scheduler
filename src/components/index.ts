/*
 * Barrel for every shared component. Screens may import from here or from the
 * individual modules — both are stable.
 */

export { Button, IconButton, BackLink } from "./Button.tsx";
export type {
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  IconButtonProps,
  BackLinkProps,
} from "./Button.tsx";

export { CancelModal } from "./CancelModal.tsx";

export {
  Banner,
  Card,
  CodePill,
  EmptyState,
  Eyebrow,
  PanelHeader,
  StatusPill,
  SuccessTile,
} from "./Card.tsx";
export type {
  BannerProps,
  BannerTone,
  CardProps,
  CodePillProps,
  EmptyStateProps,
  EyebrowProps,
  PanelHeaderProps,
  StatusPillProps,
  StatusTone,
  SuccessTileProps,
} from "./Card.tsx";

export { Checkbox, CheckboxRow } from "./Checkbox.tsx";
export type { CheckboxProps, CheckboxRowProps } from "./Checkbox.tsx";

export { Chip } from "./Chip.tsx";
export type { ChipProps } from "./Chip.tsx";

export { Field, Select, TextArea, TextInput } from "./Field.tsx";
export type {
  ControlProps,
  FieldProps,
  SelectProps,
  TextAreaProps,
  TextInputProps,
} from "./Field.tsx";

export { Footer } from "./Footer.tsx";
export { Header } from "./Header.tsx";

export { Icon, ICONS } from "./Icon.tsx";
export type { IconName, IconProps } from "./Icon.tsx";

export { MobileSheet } from "./MobileSheet.tsx";

export { NumberStepper } from "./NumberStepper.tsx";
export type { NumberStepperProps } from "./NumberStepper.tsx";

export {
  Avatar,
  IconTile,
  PlaceholderTile,
  placeholderBackground,
  placeholderInk,
  useIsDark,
} from "./PlaceholderTile.tsx";
export type {
  AvatarProps,
  IconTileProps,
  PlaceholderTileProps,
} from "./PlaceholderTile.tsx";

export { Radio } from "./Radio.tsx";
export type { RadioProps } from "./Radio.tsx";

export { ReviewCard } from "./ReviewCard.tsx";
export type { ReviewCardProps } from "./ReviewCard.tsx";

export { Segmented } from "./Segmented.tsx";
export type { SegmentedOption, SegmentedProps } from "./Segmented.tsx";

export { ServiceCard } from "./ServiceCard.tsx";
export type { ServiceCardProps } from "./ServiceCard.tsx";

export { ServiceRow } from "./ServiceRow.tsx";
export type { ServiceRowProps } from "./ServiceRow.tsx";

export { SlotButton, SlotSkeleton } from "./SlotButton.tsx";
export type { SlotButtonProps, SlotSkeletonProps } from "./SlotButton.tsx";

export { StaffRow } from "./StaffRow.tsx";
export type { StaffRowProps } from "./StaffRow.tsx";

export { StaffTile } from "./StaffTile.tsx";
export type { StaffTileProps } from "./StaffTile.tsx";

export { StarBar } from "./StarBar.tsx";
export type { StarBarProps } from "./StarBar.tsx";

export { GiftStepper, Stepper } from "./Stepper.tsx";
export type { GiftStepperProps, StepperProps } from "./Stepper.tsx";

export { ToastLayer } from "./Toast.tsx";

export { Toggle } from "./Toggle.tsx";
export type { ToggleProps } from "./Toggle.tsx";

export { useFocusTrap } from "./useFocusTrap.ts";

export { DayChip, WeekStrip } from "./WeekStrip.tsx";
export type { DayChipProps, WeekStripProps } from "./WeekStrip.tsx";

export { WaitlistCard } from "./WaitlistCard.tsx";
export type { WaitlistCardProps } from "./WaitlistCard.tsx";

/* --- added by the 2026-07-28 comp revision: the two-persona shell --- */

export { default as DemoDock } from "./DemoDock.tsx";
export { default as StudioChrome } from "./StudioChrome.tsx";
export {
  BRAND,
  GUEST_SCREENS,
  STUDIO_NAV_BIZ,
  STUDIO_NAV_OPS,
  STUDIO_PAGE_META,
  STUDIO_SCREENS,
  screensFor,
} from "./chrome.ts";
export type { DockScreen, StudioNavItem } from "./chrome.ts";
