import { affingerCiteResolver } from '../cites/affinger.js'
import { amebaCiteResolver } from '../cites/ameba.js'
import { blogCardCiteResolver } from '../cites/blogcard.js'
import { buddybossCiteResolver } from '../cites/buddyboss.js'
import { buddypressCiteResolver } from '../cites/buddypress.js'
import { cocoonCiteResolver } from '../cites/cocoon.js'
import {
  devtoLegacyPostCiteResolver,
  devtoLinkCiteResolver,
  devtoPostCiteResolver,
} from '../cites/devto.js'
import { discourseCiteResolver } from '../cites/discourse.js'
import { embedlyCiteResolver } from '../cites/embedly.js'
import { ghostCiteResolver } from '../cites/ghost.js'
import { hatenaCiteResolver } from '../cites/hatena.js'
import { mediumCiteResolver } from '../cites/medium.js'
import { microformatsCiteResolver } from '../cites/microformats.js'
import { nodebbCiteResolver } from '../cites/nodebb.js'
import { notecomCiteResolver } from '../cites/notecom.js'
import { nytimesCiteResolver } from '../cites/nytimes.js'
import { paragraphCiteResolver } from '../cites/paragraph.js'
import { pzlinkcardCiteResolver } from '../cites/pzlinkcard.js'
import {
  substackCrossPostCiteResolver,
  substackOwnPostCiteResolver,
  substackPostEmbedCiteResolver,
  substackPublicationCiteResolver,
} from '../cites/substack.js'
import { swellCiteResolver } from '../cites/swell.js'
import { tcdCiteResolver } from '../cites/tcd.js'
import { tistoryCiteResolver } from '../cites/tistory.js'
import { tumblrCiteResolver } from '../cites/tumblr.js'
import { xenforoCiteResolver } from '../cites/xenforo.js'
import { acastEmbedResolver } from '../embeds/acast.js'
import { anchorEmbedResolver } from '../embeds/anchor.js'
import { aparatIframeEmbedResolver, aparatScriptEmbedResolver } from '../embeds/aparat.js'
import { appleEmbedResolver } from '../embeds/apple.js'
import { archiveFlashEmbedResolver, archiveIframeEmbedResolver } from '../embeds/archive.js'
import { arteEmbedResolver } from '../embeds/arte.js'
import { audioboomIframeEmbedResolver, audioboomWidgetEmbedResolver } from '../embeds/audioboom.js'
import { audiomackEmbedResolver } from '../embeds/audiomack.js'
import { aushaEmbedResolver } from '../embeds/ausha.js'
import { bandcampEmbedResolver } from '../embeds/bandcamp.js'
import { bbcIframeEmbedResolver } from '../embeds/bbc.js'
import { bitchuteEmbedResolver } from '../embeds/bitchute.js'
import { bloggerEmbedResolver } from '../embeds/blogger.js'
import { blubrryEmbedResolver } from '../embeds/blubrry.js'
import {
  blueskyBlockquoteEmbedResolver,
  blueskyIframeEmbedResolver,
  blueskyPostElementEmbedResolver,
  blueskyS9eEmbedResolver,
} from '../embeds/bluesky.js'
import { bridEmbedResolver } from '../embeds/brid.js'
import {
  brightcoveExperienceEmbedResolver,
  brightcoveFlashEmbedResolver,
  brightcoveIframeEmbedResolver,
  brightcoveVideoJsEmbedResolver,
} from '../embeds/brightcove.js'
import {
  buzzsproutIframeEmbedResolver,
  buzzsproutScriptEmbedResolver,
} from '../embeds/buzzsprout.js'
import { captivateEmbedResolver } from '../embeds/captivate.js'
import { cnbcIframeEmbedResolver } from '../embeds/cnbc.js'
import {
  cnnFlashEmbedResolver,
  cnnIframeEmbedResolver,
  cnnScriptEmbedResolver,
} from '../embeds/cnn.js'
import { codepenIframeEmbedResolver, codepenWidgetEmbedResolver } from '../embeds/codepen.js'
import { codesandboxIframeEmbedResolver } from '../embeds/codesandbox.js'
import { dailymotionEmbedResolver } from '../embeds/dailymotion.js'
import { deezerEmbedResolver } from '../embeds/deezer.js'
import { donorboxEmbedResolver } from '../embeds/donorbox.js'
import {
  facebookAmpEmbedResolver,
  facebookBlockquoteEmbedResolver,
  facebookIframeEmbedResolver,
  facebookWidgetEmbedResolver,
  facebookXfbmlEmbedResolver,
} from '../embeds/facebook.js'
import { figshareEmbedResolver } from '../embeds/figshare.js'
import { firesideEmbedResolver } from '../embeds/fireside.js'
import { flickrEmbedResolver } from '../embeds/flickr.js'
import { flourishIframeEmbedResolver, flourishWidgetEmbedResolver } from '../embeds/flourish.js'
import { foxnewsIframeEmbedResolver, foxnewsScriptEmbedResolver } from '../embeds/foxnews.js'
import { geniallyEmbedResolver } from '../embeds/genially.js'
import { gettyImagesEmbedResolver } from '../embeds/gettyimages.js'
import { glomexElementEmbedResolver, glomexIframeEmbedResolver } from '../embeds/glomex.js'
import { googledriveEmbedResolver } from '../embeds/googledrive.js'
import { googleslidesEmbedResolver } from '../embeds/googleslides.js'
import { guardianEmbedResolver } from '../embeds/guardian.js'
import { imgurBlockquoteEmbedResolver, imgurIframeEmbedResolver } from '../embeds/imgur.js'
import {
  instagramAmpEmbedResolver,
  instagramBlockquoteEmbedResolver,
  instagramIframeEmbedResolver,
  instagramSubstackEmbedResolver,
} from '../embeds/instagram.js'
import { issuuIframeEmbedResolver, issuuWidgetEmbedResolver } from '../embeds/issuu.js'
import { ivooxEmbedResolver } from '../embeds/ivoox.js'
import {
  jwplayerAmpEmbedResolver,
  jwplayerIframeEmbedResolver,
  jwplayerScriptEmbedResolver,
  jwplayerSetupEmbedResolver,
} from '../embeds/jwplayer.js'
import { kalturaIframeEmbedResolver, kalturaScriptEmbedResolver } from '../embeds/kaltura.js'
import { libsynEmbedResolver } from '../embeds/libsyn.js'
import { linkedinEmbedResolver } from '../embeds/linkedin.js'
import { mailruEmbedResolver } from '../embeds/mailru.js'
import { mastodonEmbedResolver } from '../embeds/mastodon.js'
import { mediavineScriptEmbedResolver, mediavineWidgetEmbedResolver } from '../embeds/mediavine.js'
import { megaphoneEmbedResolver } from '../embeds/megaphone.js'
import { megatvEmbedResolver } from '../embeds/megatv.js'
import { mixcloudEmbedResolver } from '../embeds/mixcloud.js'
import { nicovideoIframeEmbedResolver, nicovideoScriptEmbedResolver } from '../embeds/nicovideo.js'
import { notecomIframeEmbedResolver } from '../embeds/notecom.js'
import { nytimesIframeEmbedResolver } from '../embeds/nytimes.js'
import { odyseeEmbedResolver } from '../embeds/odysee.js'
import { omnyEmbedResolver } from '../embeds/omny.js'
import { padletEmbedResolver } from '../embeds/padlet.js'
import { peertubeEmbedResolver } from '../embeds/peertube.js'
import { podbeanEmbedResolver } from '../embeds/podbean.js'
import { podetizeIframeEmbedResolver, podetizeScriptEmbedResolver } from '../embeds/podetize.js'
import { podigeeIframeEmbedResolver, podigeeScriptEmbedResolver } from '../embeds/podigee.js'
import { podomaticEmbedResolver } from '../embeds/podomatic.js'
import { redcircleIframeEmbedResolver, redcircleScriptEmbedResolver } from '../embeds/redcircle.js'
import { redditIframeEmbedResolver, redditWidgetEmbedResolver } from '../embeds/reddit.js'
import { reverbnationEmbedResolver } from '../embeds/reverbnation.js'
import { rtveFlashEmbedResolver, rtveIframeEmbedResolver } from '../embeds/rtve.js'
import { rutubeEmbedResolver } from '../embeds/rutube.js'
import { scribdFlashEmbedResolver, scribdIframeEmbedResolver } from '../embeds/scribd.js'
import { simplecastEmbedResolver } from '../embeds/simplecast.js'
import { sketchfabEmbedResolver } from '../embeds/sketchfab.js'
import {
  slideshareFlashEmbedResolver,
  slideshareIframeEmbedResolver,
} from '../embeds/slideshare.js'
import { soundcloudEmbedResolver } from '../embeds/soundcloud.js'
import {
  speakerdeckIframeEmbedResolver,
  speakerdeckScriptEmbedResolver,
} from '../embeds/speakerdeck.js'
import { spotifyEmbedResolver } from '../embeds/spotify.js'
import { spreakerAnchorEmbedResolver, spreakerIframeEmbedResolver } from '../embeds/spreaker.js'
import { stackblitzIframeEmbedResolver } from '../embeds/stackblitz.js'
import { standfmEmbedResolver } from '../embeds/standfm.js'
import { tedEmbedResolver } from '../embeds/ted.js'
import { telegramIframeEmbedResolver, telegramScriptEmbedResolver } from '../embeds/telegram.js'
import { tencentEmbedResolver } from '../embeds/tencent.js'
import { tiktokBlockquoteEmbedResolver, tiktokIframeEmbedResolver } from '../embeds/tiktok.js'
import { transistorEmbedResolver } from '../embeds/transistor.js'
import { tumblrIframeEmbedResolver, tumblrPostEmbedResolver } from '../embeds/tumblr.js'
import {
  twitterAmpEmbedResolver,
  twitterBlockquoteEmbedResolver,
  twitterIframeEmbedResolver,
  twitterSubstackEmbedResolver,
} from '../embeds/twitter.js'
import { typeformIframeEmbedResolver, typeformWidgetEmbedResolver } from '../embeds/typeform.js'
import {
  videopressFlashEmbedResolver,
  videopressIframeEmbedResolver,
} from '../embeds/videopress.js'
import { vimeoEmbedResolver } from '../embeds/vimeo.js'
import { wikimediaEmbedResolver } from '../embeds/wikimedia.js'
import { wistiaEmbedResolver } from '../embeds/wistia.js'
import { youkuEmbedResolver } from '../embeds/youku.js'
import { youtubeAmpEmbedResolver, youtubeIframeEmbedResolver } from '../embeds/youtube.js'
import { zencastrBlockquoteEmbedResolver, zencastrIframeEmbedResolver } from '../embeds/zencastr.js'
import { amebaEmojiResolver } from '../emojis/ameba.js'
import { artstationEmojiResolver } from '../emojis/artstation.js'
import { bitrixEmojiResolver } from '../emojis/bitrix.js'
import { boardgamegeekEmojiResolver } from '../emojis/boardgamegeek.js'
import { btblogEmojiResolver } from '../emojis/btblog.js'
import { cocologEmojiResolver } from '../emojis/cocolog.js'
import { cuteeditorEmojiResolver } from '../emojis/cuteeditor.js'
import { discordEmojiResolver } from '../emojis/discord.js'
import { discourseEmojiResolver } from '../emojis/discourse.js'
import { discuzEmojiResolver } from '../emojis/discuz.js'
import { dropboxEmojiResolver } from '../emojis/dropbox.js'
import { drupalEmojiResolver } from '../emojis/drupal.js'
import { e107EmojiResolver } from '../emojis/e107.js'
import { easydiscussEmojiResolver } from '../emojis/easydiscuss.js'
import { emojiareaEmojiResolver } from '../emojis/emojiarea.js'
import { exblogEmojiResolver } from '../emojis/exblog.js'
import {
  facebookClassicEmojiResolver,
  facebookElementEmojiResolver,
  facebookEmojiResolver,
  facebookLabelEmojiResolver,
} from '../emojis/facebook.js'
import { fc2EmojiResolver } from '../emojis/fc2.js'
import { forumotionEmojiResolver } from '../emojis/forumotion.js'
import { froalaElementEmojiResolver, froalaImageEmojiResolver } from '../emojis/froala.js'
import { fudforumEmojiResolver } from '../emojis/fudforum.js'
import { genericCharacterEmojiResolver, genericEmojiResolver } from '../emojis/generic.js'
import { githubElementEmojiResolver, githubImageEmojiResolver } from '../emojis/github.js'
import { gitlabEmojiResolver } from '../emojis/gitlab.js'
import { gmailEmojiResolver } from '../emojis/gmail.js'
import { greensmiliesEmojiResolver } from '../emojis/greensmilies.js'
import { homepagingEmojiResolver } from '../emojis/homepaging.js'
import { invisionEmojiResolver } from '../emojis/invision.js'
import { jeuxvideoEmojiResolver } from '../emojis/jeuxvideo.js'
import { jforumEmojiResolver } from '../emojis/jforum.js'
import { jiveEmojiResolver } from '../emojis/jive.js'
import { joypixelsEmojiResolver } from '../emojis/joypixels.js'
import { jugemEmojiResolver } from '../emojis/jugem.js'
import { khorosEmojiResolver, khorosImageEmojiResolver } from '../emojis/khoros.js'
import { kunenaEmojiResolver } from '../emojis/kunena.js'
import { lexicalEmojiResolver } from '../emojis/lexical.js'
import { liferayEmojiResolver } from '../emojis/liferay.js'
import { livedoorEmojiResolver } from '../emojis/livedoor.js'
import { liveinternetEmojiResolver } from '../emojis/liveinternet.js'
import { mastodonEmojiResolver } from '../emojis/mastodon.js'
import { maxEmojiResolver } from '../emojis/max.js'
import { mixiEmojiResolver } from '../emojis/mixi.js'
import { monalisaEmojiResolver } from '../emojis/monalisa.js'
import { moodleEmojiResolver } from '../emojis/moodle.js'
import { mozillaEmojiResolver } from '../emojis/mozilla.js'
import { nbbcEmojiResolver } from '../emojis/nbbc.js'
import { notoEmojiResolver } from '../emojis/noto.js'
import { okEmojiResolver } from '../emojis/ok.js'
import { pivotxEmojiResolver } from '../emojis/pivotx.js'
import { pixnetEmojiResolver } from '../emojis/pixnet.js'
import { punbbEmojiResolver } from '../emojis/punbb.js'
import { quillEmojiResolver } from '../emojis/quill.js'
import { rakutenEmojiResolver } from '../emojis/rakuten.js'
import { rcmsEmojiResolver } from '../emojis/rcms.js'
import { rhymixEmojiResolver } from '../emojis/rhymix.js'
import { sapoEmojiResolver } from '../emojis/sapo.js'
import { seesaaEmojiResolver } from '../emojis/seesaa.js'
import { shinobiEmojiResolver } from '../emojis/shinobi.js'
import { simplePressEmojiResolver } from '../emojis/simplepress.js'
import { slackEmojiResolver } from '../emojis/slack.js'
import { smfEmojiResolver } from '../emojis/smf.js'
import { smiliesEmojiResolver, smiliesEmoticonEmojiResolver } from '../emojis/smilies.js'
import { tapatalkEmojiResolver } from '../emojis/tapatalk.js'
import { teamsEmojiResolver } from '../emojis/teams.js'
import {
  telegramElementEmojiResolver,
  telegramEmojiResolver,
  telegramImageEmojiResolver,
} from '../emojis/telegram.js'
import { tinymceEmojiResolver } from '../emojis/tinymce.js'
import { tiptapEmojiResolver } from '../emojis/tiptap.js'
import { tistoryEmojiResolver } from '../emojis/tistory.js'
import { twemojiElementEmojiResolver, twemojiEmojiResolver } from '../emojis/twemoji.js'
import { ucozEmojiResolver } from '../emojis/ucoz.js'
import { vanillaEmojiResolver } from '../emojis/vanilla.js'
import { vkEmojiResolver } from '../emojis/vk.js'
import { webWizEmojiResolver } from '../emojis/webwiz.js'
import { weiboEmojiResolver } from '../emojis/weibo.js'
import { whatsappEmojiResolver } from '../emojis/whatsapp.js'
import { wordpressElementEmojiResolver, wordpressEmojiResolver } from '../emojis/wordpress.js'
import { xenforoEmojiResolver } from '../emojis/xenforo.js'
import { yahooEmojiResolver } from '../emojis/yahoo.js'
import { yahooJapanEmojiResolver } from '../emojis/yahoojapan.js'
import { discourseMediaResolver } from '../media/discourse.js'
import { ghostMediaResolver } from '../media/ghost.js'
import { podloveMediaResolver } from '../media/podlove.js'
import { substackMediaResolver } from '../media/substack.js'
import { tumblrMediaResolver } from '../media/tumblr.js'
import { wechatMediaResolver } from '../media/wechat.js'
import { weeblyMediaResolver } from '../media/weebly.js'
import { wikimediaMediaResolver } from '../media/wikimedia.js'
import type {
  CiteResolver,
  EmbedResolver,
  EmojiResolver,
  MediaResolver,
  WidgetResolver,
} from '../types.js'

// Alphabetical by platform, so a new resolver lands on its own line instead of at the tail.
// Order still matters when selectors overlap: each resolver runs in array order and a claimed
// element can't be re-matched, so a broader selector leaves the alphabet and moves below.
const embedResolvers: Array<EmbedResolver> = [
  acastEmbedResolver,
  anchorEmbedResolver,
  aparatIframeEmbedResolver,
  aparatScriptEmbedResolver,
  appleEmbedResolver,
  archiveIframeEmbedResolver,
  archiveFlashEmbedResolver,
  arteEmbedResolver,
  audioboomIframeEmbedResolver,
  audioboomWidgetEmbedResolver,
  audiomackEmbedResolver,
  aushaEmbedResolver,
  bandcampEmbedResolver,
  bbcIframeEmbedResolver,
  bitchuteEmbedResolver,
  bloggerEmbedResolver,
  blubrryEmbedResolver,
  blueskyBlockquoteEmbedResolver,
  blueskyIframeEmbedResolver,
  blueskyS9eEmbedResolver,
  blueskyPostElementEmbedResolver,
  bridEmbedResolver,
  brightcoveExperienceEmbedResolver,
  brightcoveFlashEmbedResolver,
  brightcoveIframeEmbedResolver,
  brightcoveVideoJsEmbedResolver,
  buzzsproutIframeEmbedResolver,
  buzzsproutScriptEmbedResolver,
  captivateEmbedResolver,
  cnbcIframeEmbedResolver,
  cnnScriptEmbedResolver,
  cnnFlashEmbedResolver,
  cnnIframeEmbedResolver,
  codepenWidgetEmbedResolver,
  codepenIframeEmbedResolver,
  codesandboxIframeEmbedResolver,
  dailymotionEmbedResolver,
  deezerEmbedResolver,
  donorboxEmbedResolver,
  facebookWidgetEmbedResolver,
  facebookIframeEmbedResolver,
  facebookBlockquoteEmbedResolver,
  facebookXfbmlEmbedResolver,
  facebookAmpEmbedResolver,
  figshareEmbedResolver,
  firesideEmbedResolver,
  flickrEmbedResolver,
  flourishWidgetEmbedResolver,
  flourishIframeEmbedResolver,
  foxnewsScriptEmbedResolver,
  foxnewsIframeEmbedResolver,
  geniallyEmbedResolver,
  gettyImagesEmbedResolver,
  glomexIframeEmbedResolver,
  glomexElementEmbedResolver,
  googledriveEmbedResolver,
  googleslidesEmbedResolver,
  guardianEmbedResolver,
  imgurBlockquoteEmbedResolver,
  imgurIframeEmbedResolver,
  instagramBlockquoteEmbedResolver,
  instagramAmpEmbedResolver,
  instagramSubstackEmbedResolver,
  instagramIframeEmbedResolver,
  issuuWidgetEmbedResolver,
  issuuIframeEmbedResolver,
  ivooxEmbedResolver,
  jwplayerIframeEmbedResolver,
  jwplayerScriptEmbedResolver,
  jwplayerAmpEmbedResolver,
  jwplayerSetupEmbedResolver,
  kalturaIframeEmbedResolver,
  kalturaScriptEmbedResolver,
  libsynEmbedResolver,
  linkedinEmbedResolver,
  mailruEmbedResolver,
  mediavineWidgetEmbedResolver,
  mediavineScriptEmbedResolver,
  megaphoneEmbedResolver,
  megatvEmbedResolver,
  mixcloudEmbedResolver,
  nicovideoScriptEmbedResolver,
  nicovideoIframeEmbedResolver,
  notecomIframeEmbedResolver,
  nytimesIframeEmbedResolver,
  odyseeEmbedResolver,
  omnyEmbedResolver,
  padletEmbedResolver,
  podbeanEmbedResolver,
  podetizeScriptEmbedResolver,
  podetizeIframeEmbedResolver,
  podigeeScriptEmbedResolver,
  podigeeIframeEmbedResolver,
  podomaticEmbedResolver,
  redcircleScriptEmbedResolver,
  redcircleIframeEmbedResolver,
  redditWidgetEmbedResolver,
  redditIframeEmbedResolver,
  reverbnationEmbedResolver,
  rtveIframeEmbedResolver,
  rtveFlashEmbedResolver,
  rutubeEmbedResolver,
  scribdFlashEmbedResolver,
  scribdIframeEmbedResolver,
  simplecastEmbedResolver,
  sketchfabEmbedResolver,
  slideshareFlashEmbedResolver,
  slideshareIframeEmbedResolver,
  soundcloudEmbedResolver,
  speakerdeckScriptEmbedResolver,
  speakerdeckIframeEmbedResolver,
  spotifyEmbedResolver,
  spreakerIframeEmbedResolver,
  spreakerAnchorEmbedResolver,
  stackblitzIframeEmbedResolver,
  standfmEmbedResolver,
  tedEmbedResolver,
  telegramScriptEmbedResolver,
  telegramIframeEmbedResolver,
  tencentEmbedResolver,
  tiktokBlockquoteEmbedResolver,
  tiktokIframeEmbedResolver,
  transistorEmbedResolver,
  tumblrIframeEmbedResolver,
  tumblrPostEmbedResolver,
  twitterBlockquoteEmbedResolver,
  twitterAmpEmbedResolver,
  twitterSubstackEmbedResolver,
  twitterIframeEmbedResolver,
  typeformWidgetEmbedResolver,
  typeformIframeEmbedResolver,
  videopressIframeEmbedResolver,
  videopressFlashEmbedResolver,
  vimeoEmbedResolver,
  wistiaEmbedResolver,
  youkuEmbedResolver,
  youtubeIframeEmbedResolver,
  youtubeAmpEmbedResolver,
  zencastrBlockquoteEmbedResolver,
  zencastrIframeEmbedResolver,
  // Last, outside the alphabet: keyed on a path shape rather than a host, so every resolver
  // naming a host gets the carrier first.
  mastodonEmbedResolver,
  wikimediaEmbedResolver,
  peertubeEmbedResolver,
]

// Alphabetical by platform. Wikimedia's bare `iframe` selector sits last so a host-keyed
// resolver gets the carrier first.
const mediaResolvers: Array<MediaResolver> = [
  discourseMediaResolver,
  ghostMediaResolver,
  podloveMediaResolver,
  substackMediaResolver,
  tumblrMediaResolver,
  wechatMediaResolver,
  weeblyMediaResolver,
  wikimediaMediaResolver,
]

// Alphabetical by platform. A resolver replaces the element it matches, so a later one never
// sees it, and a broader selector leaves the alphabet and moves below.
const citeResolvers: Array<CiteResolver> = [
  affingerCiteResolver,
  amebaCiteResolver,
  blogCardCiteResolver,
  buddybossCiteResolver,
  buddypressCiteResolver,
  cocoonCiteResolver,
  devtoLinkCiteResolver,
  devtoPostCiteResolver,
  devtoLegacyPostCiteResolver,
  discourseCiteResolver,
  embedlyCiteResolver,
  ghostCiteResolver,
  hatenaCiteResolver,
  mediumCiteResolver,
  nodebbCiteResolver,
  notecomCiteResolver,
  nytimesCiteResolver,
  paragraphCiteResolver,
  pzlinkcardCiteResolver,
  substackOwnPostCiteResolver,
  substackCrossPostCiteResolver,
  substackPostEmbedCiteResolver,
  substackPublicationCiteResolver,
  swellCiteResolver,
  tcdCiteResolver,
  tistoryCiteResolver,
  tumblrCiteResolver,
  xenforoCiteResolver,
  // Last, outside the alphabet: `.h-cite` is generic markup any card may also carry.
  microformatsCiteResolver,
]

export const defaultWidgetResolvers: Array<WidgetResolver> = [
  ...embedResolvers,
  ...mediaResolvers,
  ...citeResolvers,
]

// First claim wins, so every resolver that reads a filename sits ahead of the ones that only
// mark: an image on a CDN host can still carry a forum class whose table resolves it.
export const defaultEmojiResolvers: Array<EmojiResolver> = [
  telegramEmojiResolver,
  gitlabEmojiResolver,
  githubElementEmojiResolver,
  khorosEmojiResolver,
  jiveEmojiResolver,
  facebookClassicEmojiResolver,
  facebookLabelEmojiResolver,
  facebookElementEmojiResolver,
  twemojiElementEmojiResolver,
  telegramElementEmojiResolver,
  whatsappEmojiResolver,
  wordpressElementEmojiResolver,
  mozillaEmojiResolver,
  emojiareaEmojiResolver,
  quillEmojiResolver,
  lexicalEmojiResolver,
  tiptapEmojiResolver,
  froalaElementEmojiResolver,
  // Ahead of smilies, whose /smiles/ directory would read a Bitrix file by its filename first.
  bitrixEmojiResolver,
  // Ahead of smilies, whose forum names draw Liferay's smile.gif as 🙂.
  liferayEmojiResolver,
  khorosImageEmojiResolver,
  webWizEmojiResolver,
  discuzEmojiResolver,
  forumotionEmojiResolver,
  kunenaEmojiResolver,
  invisionEmojiResolver,
  xenforoEmojiResolver,
  smfEmojiResolver,
  nbbcEmojiResolver,
  simplePressEmojiResolver,
  drupalEmojiResolver,
  monalisaEmojiResolver,
  easydiscussEmojiResolver,
  tinymceEmojiResolver,
  fudforumEmojiResolver,
  e107EmojiResolver,
  jforumEmojiResolver,
  ucozEmojiResolver,
  smiliesEmojiResolver,
  punbbEmojiResolver,
  yahooEmojiResolver,
  yahooJapanEmojiResolver,
  froalaImageEmojiResolver,
  // Ahead of Twemoji, whose loose `twemoji` url match also takes Discourse's `twemoji` set, drawn
  // under Discourse's own names.
  discourseEmojiResolver,
  // Ahead of WordPress, whose WordPress.com host serves Twemoji files named by codepoint.
  twemojiEmojiResolver,
  wordpressEmojiResolver,
  vanillaEmojiResolver,
  artstationEmojiResolver,
  joypixelsEmojiResolver,
  facebookEmojiResolver,
  githubImageEmojiResolver,
  slackEmojiResolver,
  notoEmojiResolver,
  dropboxEmojiResolver,
  gmailEmojiResolver,
  okEmojiResolver,
  homepagingEmojiResolver,
  telegramImageEmojiResolver,
  vkEmojiResolver,
  maxEmojiResolver,
  mastodonEmojiResolver,
  weiboEmojiResolver,
  amebaEmojiResolver,
  teamsEmojiResolver,
  discordEmojiResolver,
  tapatalkEmojiResolver,
  livedoorEmojiResolver,
  seesaaEmojiResolver,
  sapoEmojiResolver,
  exblogEmojiResolver,
  cocologEmojiResolver,
  jugemEmojiResolver,
  fc2EmojiResolver,
  moodleEmojiResolver,
  boardgamegeekEmojiResolver,
  rhymixEmojiResolver,
  pivotxEmojiResolver,
  cuteeditorEmojiResolver,
  shinobiEmojiResolver,
  liveinternetEmojiResolver,
  greensmiliesEmojiResolver,
  rcmsEmojiResolver,
  jeuxvideoEmojiResolver,
  rakutenEmojiResolver,
  mixiEmojiResolver,
  tistoryEmojiResolver,
  btblogEmojiResolver,
  pixnetEmojiResolver,
  genericCharacterEmojiResolver,
  // After every engine, since TypePad, Yahoo and others put the emoticon class on their own sets.
  smiliesEmoticonEmojiResolver,
  // Last, since the class is shared by engines whose own signals say more.
  genericEmojiResolver,
]
