import { acastFieldCleaners } from '../embeds/acast.js'
import { appleFieldCleaners } from '../embeds/apple.js'
import { archiveFieldCleaners } from '../embeds/archive.js'
import { audioboomFieldCleaners } from '../embeds/audioboom.js'
import { bandcampFieldCleaners } from '../embeds/bandcamp.js'
import { bloggerFieldCleaners } from '../embeds/blogger.js'
import { blubrryFieldCleaners } from '../embeds/blubrry.js'
import { codepenFieldCleaners } from '../embeds/codepen.js'
import { dailymotionFieldCleaners } from '../embeds/dailymotion.js'
import { deezerFieldCleaners } from '../embeds/deezer.js'
import { flourishFieldCleaners } from '../embeds/flourish.js'
import { instagramFieldCleaners } from '../embeds/instagram.js'
import { ivooxFieldCleaners } from '../embeds/ivoox.js'
import { kalturaFieldCleaners } from '../embeds/kaltura.js'
import { libsynFieldCleaners } from '../embeds/libsyn.js'
import { nytimesFieldCleaners } from '../embeds/nytimes.js'
import { sketchfabFieldCleaners } from '../embeds/sketchfab.js'
import { speakerdeckFieldCleaners } from '../embeds/speakerdeck.js'
import { spotifyFieldCleaners } from '../embeds/spotify.js'
import { videopressFieldCleaners } from '../embeds/videopress.js'
import { vimeoFieldCleaners } from '../embeds/vimeo.js'
import { youtubeFieldCleaners } from '../embeds/youtube.js'
import type { FieldCleaner } from '../types.js'

// The labels a platform's snippet writes where the item's own title or description belongs,
// stripped once where every placeholder is prepared rather than in each resolver. Declared
// beside the resolver that knows the platform.
export const defaultFieldCleaners: Array<FieldCleaner> = [
  ...acastFieldCleaners,
  ...appleFieldCleaners,
  ...archiveFieldCleaners,
  ...audioboomFieldCleaners,
  ...bandcampFieldCleaners,
  ...bloggerFieldCleaners,
  ...blubrryFieldCleaners,
  ...codepenFieldCleaners,
  ...dailymotionFieldCleaners,
  ...deezerFieldCleaners,
  ...flourishFieldCleaners,
  ...instagramFieldCleaners,
  ...ivooxFieldCleaners,
  ...kalturaFieldCleaners,
  ...libsynFieldCleaners,
  ...nytimesFieldCleaners,
  ...sketchfabFieldCleaners,
  ...speakerdeckFieldCleaners,
  ...spotifyFieldCleaners,
  ...videopressFieldCleaners,
  ...vimeoFieldCleaners,
  ...youtubeFieldCleaners,
]
