import type { TransformContext } from '../types.js'
import {
  defaultDeferredIframeSources,
  defaultLazyIframeAttributes,
  defaultLazySrcAttributes,
  defaultLazySrcsetAttributes,
  defaultMediaSrcAttributes,
} from './attributes.js'
import { defaultFieldCleaners } from './cleaners.js'
import {
  defaultAvatarImageHosts,
  defaultTrackingHosts,
  defaultTrackingPathSegments,
} from './hosts.js'
import { defaultEmojiResolvers, defaultWidgetResolvers } from './resolvers.js'
import {
  defaultNonContentSelectors,
  defaultPreservedPreClasses,
  defaultRevealableSelectors,
} from './selectors.js'
import { defaultHighlightFn, defaultResolveUrlFn } from './transforms.js'

// The context transformContent builds before it applies the caller's options.
export const defaultContext: TransformContext = {
  widgetResolvers: defaultWidgetResolvers,
  mediaSrcAttributes: defaultMediaSrcAttributes,
  lazySrcAttributes: defaultLazySrcAttributes,
  lazySrcsetAttributes: defaultLazySrcsetAttributes,
  lazyIframeAttributes: defaultLazyIframeAttributes,
  deferredIframeSources: defaultDeferredIframeSources,
  trackingHosts: defaultTrackingHosts,
  trackingPathSegments: defaultTrackingPathSegments,
  emojiResolvers: defaultEmojiResolvers,
  avatarImageHosts: defaultAvatarImageHosts,
  nonContentSelectors: defaultNonContentSelectors,
  preservedPreClasses: defaultPreservedPreClasses,
  revealableSelectors: defaultRevealableSelectors,
  fieldCleaners: defaultFieldCleaners,
  resolveUrlFn: defaultResolveUrlFn,
  highlightFn: defaultHighlightFn,
}
