import type { TransformContext } from '../types.js'
import {
  defaultDeferredIframeSources,
  defaultLazyAltAttributes,
  defaultLazyIframeAttributes,
  defaultLazySrcAttributes,
  defaultLazySrcsetAttributes,
  defaultMediaSrcAttributes,
} from './attributes.js'
import { defaultFieldCleaners } from './cleaners.js'
import { defaultAvatarImageHosts, defaultTrackingUrls } from './hosts.js'
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
  lazyAltAttributes: defaultLazyAltAttributes,
  lazyIframeAttributes: defaultLazyIframeAttributes,
  deferredIframeSources: defaultDeferredIframeSources,
  trackingUrls: defaultTrackingUrls,
  emojiResolvers: defaultEmojiResolvers,
  avatarImageHosts: defaultAvatarImageHosts,
  nonContentSelectors: defaultNonContentSelectors,
  preservedPreClasses: defaultPreservedPreClasses,
  revealableSelectors: defaultRevealableSelectors,
  fieldCleaners: defaultFieldCleaners,
  resolveUrlFn: defaultResolveUrlFn,
  highlightFn: defaultHighlightFn,
}
