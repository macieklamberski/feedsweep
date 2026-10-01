import { acastRenderHint } from '../embeds/acast.js'
import { archiveRenderHint } from '../embeds/archive.js'
import { arteRenderHint } from '../embeds/arte.js'
import { audioboomRenderHint } from '../embeds/audioboom.js'
import { aushaRenderHint } from '../embeds/ausha.js'
import { blubrryRenderHint } from '../embeds/blubrry.js'
import { blueskyRenderHint } from '../embeds/bluesky.js'
import { brRenderHint } from '../embeds/br.js'
import { bridRenderHint } from '../embeds/brid.js'
import { brightcoveRenderHint } from '../embeds/brightcove.js'
import { buzzsproutRenderHint } from '../embeds/buzzsprout.js'
import { captivateRenderHint } from '../embeds/captivate.js'
import { ccmaRenderHint } from '../embeds/ccma.js'
import { channel9RenderHint } from '../embeds/channel9.js'
import { cloudflarestreamRenderHint } from '../embeds/cloudflarestream.js'
import { cnnRenderHint } from '../embeds/cnn.js'
import { codesandboxRenderHint } from '../embeds/codesandbox.js'
import { dailymotionRenderHint } from '../embeds/dailymotion.js'
import { deezerRenderHint } from '../embeds/deezer.js'
import { documentcloudRenderHint } from '../embeds/documentcloud.js'
import { donorboxRenderHint } from '../embeds/donorbox.js'
import { facebookRenderHint } from '../embeds/facebook.js'
import { flickrRenderHint } from '../embeds/flickr.js'
import { flourishRenderHint } from '../embeds/flourish.js'
import { foxbusinessRenderHint, foxnewsRenderHint } from '../embeds/foxnews.js'
import { googledriveRenderHint } from '../embeds/googledrive.js'
import { hearthisRenderHint } from '../embeds/hearthis.js'
import { helloassoRenderHint } from '../embeds/helloasso.js'
import { iheartRenderHint } from '../embeds/iheart.js'
import { imgurRenderHint } from '../embeds/imgur.js'
import { inaRenderHint } from '../embeds/ina.js'
import { indavideoRenderHint } from '../embeds/indavideo.js'
import { infogramRenderHint } from '../embeds/infogram.js'
import { instagramRenderHint } from '../embeds/instagram.js'
import { kalturaRenderHint } from '../embeds/kaltura.js'
import { mailruRenderHint } from '../embeds/mailru.js'
import { mastodonRenderHint } from '../embeds/mastodon.js'
import { megaphoneRenderHint } from '../embeds/megaphone.js'
import { mixcloudRenderHint } from '../embeds/mixcloud.js'
import { nbcnewsRenderHint } from '../embeds/nbcnews.js'
import { neteaseRenderHint } from '../embeds/netease.js'
import { nicovideoRenderHint } from '../embeds/nicovideo.js'
import { notecomRenderHint } from '../embeds/notecom.js'
import { observableRenderHint } from '../embeds/observable.js'
import { odnoklassnikiRenderHint } from '../embeds/odnoklassniki.js'
import { omnyRenderHint } from '../embeds/omny.js'
import { pbsRenderHint } from '../embeds/pbs.js'
import { peertubeRenderHint } from '../embeds/peertube.js'
import { podbeanRenderHint } from '../embeds/podbean.js'
import { podigeeRenderHint } from '../embeds/podigee.js'
import { redditRenderHint } from '../embeds/reddit.js'
import { reverbnationRenderHint } from '../embeds/reverbnation.js'
import { rtveRenderHint } from '../embeds/rtve.js'
import { rutubeRenderHint } from '../embeds/rutube.js'
import { sketchfabRenderHint } from '../embeds/sketchfab.js'
import { soundcloudRenderHint } from '../embeds/soundcloud.js'
import { spotifyRenderHint } from '../embeds/spotify.js'
import { spreakerRenderHint } from '../embeds/spreaker.js'
import { srgplayRenderHint } from '../embeds/srgplay.js'
import { tableauRenderHint } from '../embeds/tableau.js'
import { tedRenderHint } from '../embeds/ted.js'
import { telegramRenderHint } from '../embeds/telegram.js'
import { tencentRenderHint } from '../embeds/tencent.js'
import { transistorRenderHint } from '../embeds/transistor.js'
import { tumblrRenderHint } from '../embeds/tumblr.js'
import { tuneinRenderHint } from '../embeds/tunein.js'
import { twitterRenderHint } from '../embeds/twitter.js'
import { ultimediaRenderHint } from '../embeds/ultimedia.js'
import { videopressRenderHint } from '../embeds/videopress.js'
import { vidyardRenderHint } from '../embeds/vidyard.js'
import { vimeoRenderHint } from '../embeds/vimeo.js'
import { vkRenderHint } from '../embeds/vk.js'
import { wistiaRenderHint } from '../embeds/wistia.js'
import { youkuRenderHint } from '../embeds/youku.js'
import { youtubeRenderHint } from '../embeds/youtube.js'
import type { EmbedRenderHint } from '../types.js'

// What a reader needs from each provider once it turns the placeholder into a frame: how to
// start playback on the click, by query or by a message into the frame, and how the player
// reports its rendered height. One per provider, beside its resolver.
export const defaultEmbedRenderHints: Array<EmbedRenderHint> = [
  acastRenderHint,
  archiveRenderHint,
  arteRenderHint,
  audioboomRenderHint,
  aushaRenderHint,
  blubrryRenderHint,
  blueskyRenderHint,
  bridRenderHint,
  brightcoveRenderHint,
  brRenderHint,
  buzzsproutRenderHint,
  captivateRenderHint,
  ccmaRenderHint,
  channel9RenderHint,
  cloudflarestreamRenderHint,
  cnnRenderHint,
  codesandboxRenderHint,
  dailymotionRenderHint,
  deezerRenderHint,
  documentcloudRenderHint,
  donorboxRenderHint,
  facebookRenderHint,
  flickrRenderHint,
  flourishRenderHint,
  foxbusinessRenderHint,
  foxnewsRenderHint,
  googledriveRenderHint,
  hearthisRenderHint,
  helloassoRenderHint,
  iheartRenderHint,
  imgurRenderHint,
  inaRenderHint,
  indavideoRenderHint,
  infogramRenderHint,
  instagramRenderHint,
  kalturaRenderHint,
  mailruRenderHint,
  mastodonRenderHint,
  megaphoneRenderHint,
  mixcloudRenderHint,
  nbcnewsRenderHint,
  neteaseRenderHint,
  nicovideoRenderHint,
  notecomRenderHint,
  observableRenderHint,
  odnoklassnikiRenderHint,
  omnyRenderHint,
  pbsRenderHint,
  peertubeRenderHint,
  podbeanRenderHint,
  podigeeRenderHint,
  redditRenderHint,
  reverbnationRenderHint,
  rtveRenderHint,
  rutubeRenderHint,
  sketchfabRenderHint,
  soundcloudRenderHint,
  spotifyRenderHint,
  spreakerRenderHint,
  srgplayRenderHint,
  tableauRenderHint,
  tedRenderHint,
  telegramRenderHint,
  tencentRenderHint,
  transistorRenderHint,
  tumblrRenderHint,
  tuneinRenderHint,
  twitterRenderHint,
  ultimediaRenderHint,
  videopressRenderHint,
  vidyardRenderHint,
  vimeoRenderHint,
  vkRenderHint,
  wistiaRenderHint,
  youkuRenderHint,
  youtubeRenderHint,
]
