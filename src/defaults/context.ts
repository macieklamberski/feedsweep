import type { TransformContext } from '../types.js'
import {
  defaultDeferredIframeSources,
  defaultLazyIframeAttributes,
  defaultLazySrcAttributes,
  defaultLazySrcsetAttributes,
  defaultMediaSrcAttributes,
} from './attributes.js'
import { defaultFieldCleaners } from './cleaners.js'
import { defaultAvatarImageHosts, defaultTrackingHosts } from './hosts.js'
import { defaultEmojiResolvers, defaultWidgetResolvers } from './resolvers.js'
import {
  defaultGalleryNoscriptSelectors,
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
  emojiResolvers: defaultEmojiResolvers,
  avatarImageHosts: defaultAvatarImageHosts,
  nonContentSelectors: defaultNonContentSelectors,
  preservedPreClasses: defaultPreservedPreClasses,
  revealableSelectors: defaultRevealableSelectors,
  galleryNoscriptSelectors: defaultGalleryNoscriptSelectors,
  fieldCleaners: defaultFieldCleaners,
  resolveUrlFn: defaultResolveUrlFn,
  highlightFn: defaultHighlightFn,
}
