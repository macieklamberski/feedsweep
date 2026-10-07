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
import { wordpressCiteResolver } from '../cites/wordpress.js'
import { xenforoCiteResolver } from '../cites/xenforo.js'
import { channelOneEmbedResolver } from '../embeds/1tv.js'
import {
  oneTwoThreeFormBuilderIframeEmbedResolver,
  oneTwoThreeFormBuilderScriptEmbedResolver,
} from '../embeds/123formbuilder.js'
import { threeSixtyCitiesEmbedResolver } from '../embeds/360cities.js'
import { abcnewsEmbedResolver } from '../embeds/abcnews.js'
import { abcotvEmbedResolver } from '../embeds/abcotv.js'
import { acastEmbedResolver } from '../embeds/acast.js'
import { acuityschedulingEmbedResolver } from '../embeds/acuityscheduling.js'
import { allocineEmbedResolver } from '../embeds/allocine.js'
import {
  amebaImagePageEmbedResolver,
  amebaMoviePlayerEmbedResolver,
  amebaReblogCardEmbedResolver,
} from '../embeds/ameba.js'
import { anchorEmbedResolver } from '../embeds/anchor.js'
import { aparatIframeEmbedResolver, aparatScriptEmbedResolver } from '../embeds/aparat.js'
import { appleEmbedResolver, appleToolsEmbedResolver } from '../embeds/apple.js'
import { arcgisEmbedResolver } from '../embeds/arcgis.js'
import { archiveFlashEmbedResolver, archiveIframeEmbedResolver } from '../embeds/archive.js'
import { ardmediathekEmbedResolver } from '../embeds/ardmediathek.js'
import { art19EmbedResolver } from '../embeds/art19.js'
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
import { brEmbedResolver } from '../embeds/br.js'
import { bridEmbedResolver } from '../embeds/brid.js'
import {
  brightcoveExperienceEmbedResolver,
  brightcoveFlashEmbedResolver,
  brightcoveIframeEmbedResolver,
  brightcoveVideoJsEmbedResolver,
} from '../embeds/brightcove.js'
import { bundestagIframeEmbedResolver, bundestagScriptEmbedResolver } from '../embeds/bundestag.js'
import {
  buzzsproutIframeEmbedResolver,
  buzzsproutScriptEmbedResolver,
} from '../embeds/buzzsprout.js'
import { calameoEmbedResolver } from '../embeds/calameo.js'
import { canaluEmbedResolver } from '../embeds/canalu.js'
import { canvaIframeEmbedResolver, canvaWidgetEmbedResolver } from '../embeds/canva.js'
import { captivateEmbedResolver } from '../embeds/captivate.js'
import { ccmaEmbedResolver } from '../embeds/ccma.js'
import { channel9EmbedResolver } from '../embeds/channel9.js'
import {
  cloudflarestreamIframeEmbedResolver,
  cloudflarestreamScriptEmbedResolver,
} from '../embeds/cloudflarestream.js'
import { cnbcIframeEmbedResolver } from '../embeds/cnbc.js'
import {
  cnnFlashEmbedResolver,
  cnnIframeEmbedResolver,
  cnnScriptEmbedResolver,
} from '../embeds/cnn.js'
import { codepenIframeEmbedResolver, codepenWidgetEmbedResolver } from '../embeds/codepen.js'
import { codesandboxIframeEmbedResolver } from '../embeds/codesandbox.js'
import {
  cognitoformsIframeEmbedResolver,
  cognitoformsScriptEmbedResolver,
} from '../embeds/cognitoforms.js'
import { condenastIframeEmbedResolver, condenastScriptEmbedResolver } from '../embeds/condenast.js'
import { corriereEmbedResolver } from '../embeds/corriere.js'
import {
  crowdsignalFlashEmbedResolver,
  crowdsignalIframeEmbedResolver,
  crowdsignalScriptEmbedResolver,
} from '../embeds/crowdsignal.js'
import { cspanEmbedResolver } from '../embeds/cspan.js'
import { dailymailEmbedResolver } from '../embeds/dailymail.js'
import { dailymotionEmbedResolver } from '../embeds/dailymotion.js'
import { deezerEmbedResolver } from '../embeds/deezer.js'
import { democracynowEmbedResolver } from '../embeds/democracynow.js'
import { documentcloudEmbedResolver } from '../embeds/documentcloud.js'
import { donorboxEmbedResolver } from '../embeds/donorbox.js'
import { dvidsEmbedResolver } from '../embeds/dvids.js'
import { educaplayEmbedResolver } from '../embeds/educaplay.js'
import {
  facebookAmpEmbedResolver,
  facebookBlockquoteEmbedResolver,
  facebookIframeEmbedResolver,
  facebookS9eEmbedResolver,
  facebookWidgetEmbedResolver,
  facebookXfbmlEmbedResolver,
} from '../embeds/facebook.js'
import {
  fc2BlogScriptEmbedResolver,
  fc2FlashEmbedResolver,
  fc2IframeEmbedResolver,
  fc2PlayerScriptEmbedResolver,
} from '../embeds/fc2.js'
import { figmaEmbedResolver } from '../embeds/figma.js'
import { figshareEmbedResolver } from '../embeds/figshare.js'
import { firesideEmbedResolver } from '../embeds/fireside.js'
import { firstoryEmbedResolver } from '../embeds/firstory.js'
import { flickrEmbedResolver } from '../embeds/flickr.js'
import {
  fliphtml5IframeEmbedResolver,
  fliphtml5LightBoxEmbedResolver,
} from '../embeds/fliphtml5.js'
import { flipsnackEmbedResolver } from '../embeds/flipsnack.js'
import { flourishIframeEmbedResolver, flourishWidgetEmbedResolver } from '../embeds/flourish.js'
import {
  formmailerIframeEmbedResolver,
  formmailerWidgetEmbedResolver,
} from '../embeds/formmailer.js'
import { foxnewsIframeEmbedResolver, foxnewsScriptEmbedResolver } from '../embeds/foxnews.js'
import { ganjingworldEmbedResolver } from '../embeds/ganjingworld.js'
import { garminEmbedResolver } from '../embeds/garmin.js'
import { geniallyEmbedResolver } from '../embeds/genially.js'
import { geogebraEmbedResolver } from '../embeds/geogebra.js'
import { gettyImagesEmbedResolver } from '../embeds/gettyimages.js'
import { glomexElementEmbedResolver, glomexIframeEmbedResolver } from '../embeds/glomex.js'
import { googlebooksEmbedResolver } from '../embeds/googlebooks.js'
import { googledriveEmbedResolver } from '../embeds/googledrive.js'
import { googleformsEmbedResolver } from '../embeds/googleforms.js'
import { googleslidesEmbedResolver } from '../embeds/googleslides.js'
import { guardianEmbedResolver } from '../embeds/guardian.js'
import { hearthisEmbedResolver } from '../embeds/hearthis.js'
import { helloassoEmbedResolver } from '../embeds/helloasso.js'
import { heyzineEmbedResolver } from '../embeds/heyzine.js'
import { iheartEmbedResolver } from '../embeds/iheart.js'
import { imdbEmbedResolver } from '../embeds/imdb.js'
import {
  imgurBlockquoteEmbedResolver,
  imgurIframeEmbedResolver,
  imgurS9eEmbedResolver,
} from '../embeds/imgur.js'
import { inaEmbedResolver, inaScriptEmbedResolver } from '../embeds/ina.js'
import { indavideoEmbedResolver } from '../embeds/indavideo.js'
import {
  infogramIframeEmbedResolver,
  infogramScriptEmbedResolver,
  infogramWidgetEmbedResolver,
} from '../embeds/infogram.js'
import {
  instagramAmpEmbedResolver,
  instagramBlockquoteEmbedResolver,
  instagramIframeEmbedResolver,
  instagramS9eEmbedResolver,
  instagramSubstackEmbedResolver,
} from '../embeds/instagram.js'
import { ispotEmbedResolver } from '../embeds/ispot.js'
import { issuuIframeEmbedResolver, issuuWidgetEmbedResolver } from '../embeds/issuu.js'
import { ivooxEmbedResolver } from '../embeds/ivoox.js'
import { jotformIframeEmbedResolver, jotformScriptEmbedResolver } from '../embeds/jotform.js'
import {
  jwplayerAmpEmbedResolver,
  jwplayerIframeEmbedResolver,
  jwplayerScriptEmbedResolver,
  jwplayerSetupEmbedResolver,
} from '../embeds/jwplayer.js'
import { kalturaIframeEmbedResolver, kalturaScriptEmbedResolver } from '../embeds/kaltura.js'
import { kindleEmbedResolver } from '../embeds/kindle.js'
import { komootEmbedResolver } from '../embeds/komoot.js'
import { learningappsEmbedResolver } from '../embeds/learningapps.js'
import { lglformsIframeEmbedResolver, lglformsScriptEmbedResolver } from '../embeds/lglforms.js'
import { libsynEmbedResolver } from '../embeds/libsyn.js'
import { linkedinEmbedResolver } from '../embeds/linkedin.js'
import { listennotesEmbedResolver } from '../embeds/listennotes.js'
import { mailruEmbedResolver } from '../embeds/mailru.js'
import { mastodonEmbedResolver } from '../embeds/mastodon.js'
import { matterportEmbedResolver } from '../embeds/matterport.js'
import { mediacccEmbedResolver } from '../embeds/mediaccc.js'
import { mediavineScriptEmbedResolver, mediavineWidgetEmbedResolver } from '../embeds/mediavine.js'
import { megaphoneEmbedResolver } from '../embeds/megaphone.js'
import { megatvEmbedResolver } from '../embeds/megatv.js'
import { mixcloudEmbedResolver } from '../embeds/mixcloud.js'
import { mrcvideoEmbedResolver, mrcvideoFlashEmbedResolver } from '../embeds/mrcvideo.js'
import { namashaEmbedResolver } from '../embeds/namasha.js'
import { nbcnewsEmbedResolver } from '../embeds/nbcnews.js'
import { neteaseEmbedResolver } from '../embeds/netease.js'
import { nicovideoIframeEmbedResolver, nicovideoScriptEmbedResolver } from '../embeds/nicovideo.js'
import { notecomIframeEmbedResolver } from '../embeds/notecom.js'
import { nprFlashEmbedResolver, nprIframeEmbedResolver } from '../embeds/npr.js'
import { nytimesIframeEmbedResolver } from '../embeds/nytimes.js'
import { observableEmbedResolver } from '../embeds/observable.js'
import { odnoklassnikiEmbedResolver } from '../embeds/odnoklassniki.js'
import { odyseeEmbedResolver } from '../embeds/odysee.js'
import { officeEmbedResolver } from '../embeds/office.js'
import { omnyEmbedResolver } from '../embeds/omny.js'
import { opendriveEmbedResolver } from '../embeds/opendrive.js'
import { ourworldindataEmbedResolver } from '../embeds/ourworldindata.js'
import { padletEmbedResolver } from '../embeds/padlet.js'
import { pastebinIframeEmbedResolver, pastebinScriptEmbedResolver } from '../embeds/pastebin.js'
import { patroniteEmbedResolver } from '../embeds/patronite.js'
import {
  pbsFlashEmbedResolver,
  pbsIframeEmbedResolver,
  pbsLegacyIframeEmbedResolver,
} from '../embeds/pbs.js'
import { peertubeEmbedResolver } from '../embeds/peertube.js'
import { piktochartIframeEmbedResolver } from '../embeds/piktochart.js'
import { pinecastEmbedResolver } from '../embeds/pinecast.js'
import { pixivIframeEmbedResolver, pixivScriptEmbedResolver } from '../embeds/pixiv.js'
import { podbeanEmbedResolver } from '../embeds/podbean.js'
import { podcloudIframeEmbedResolver, podcloudWidgetEmbedResolver } from '../embeds/podcloud.js'
import { podetizeIframeEmbedResolver, podetizeScriptEmbedResolver } from '../embeds/podetize.js'
import { podigeeIframeEmbedResolver, podigeeScriptEmbedResolver } from '../embeds/podigee.js'
import { podomaticEmbedResolver } from '../embeds/podomatic.js'
import { preziEmbedResolver } from '../embeds/prezi.js'
import { puzzlemeEmbedResolver, puzzlemeWidgetEmbedResolver } from '../embeds/puzzleme.js'
import { radioradicaleEmbedResolver } from '../embeds/radioradicale.js'
import { redcircleIframeEmbedResolver, redcircleScriptEmbedResolver } from '../embeds/redcircle.js'
import {
  redditIframeEmbedResolver,
  redditS9eEmbedResolver,
  redditWidgetEmbedResolver,
} from '../embeds/reddit.js'
import { reverbnationEmbedResolver } from '../embeds/reverbnation.js'
import { ridewithgpsEmbedResolver } from '../embeds/ridewithgps.js'
import { rsscomEmbedResolver } from '../embeds/rsscom.js'
import { rtveFlashEmbedResolver, rtveIframeEmbedResolver } from '../embeds/rtve.js'
import { rutubeEmbedResolver } from '../embeds/rutube.js'
import { scratchEmbedResolver } from '../embeds/scratch.js'
import { scribdFlashEmbedResolver, scribdIframeEmbedResolver } from '../embeds/scribd.js'
import { simplecastEmbedResolver } from '../embeds/simplecast.js'
import { sketchfabEmbedResolver } from '../embeds/sketchfab.js'
import { slideserveEmbedResolver } from '../embeds/slideserve.js'
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
import { srgplayEmbedResolver } from '../embeds/srgplay.js'
import { stackblitzIframeEmbedResolver } from '../embeds/stackblitz.js'
import { standfmEmbedResolver } from '../embeds/standfm.js'
import { steamEmbedResolver } from '../embeds/steam.js'
import { stravaIframeEmbedResolver, stravaPlaceholderEmbedResolver } from '../embeds/strava.js'
import { strawpollIframeEmbedResolver, strawpollMountEmbedResolver } from '../embeds/strawpoll.js'
import { subsplashEmbedResolver } from '../embeds/subsplash.js'
import { swayEmbedResolver } from '../embeds/sway.js'
import { symbalooEmbedResolver } from '../embeds/symbaloo.js'
import {
  tableauIframeEmbedResolver,
  tableauObjectEmbedResolver,
  tableauWidgetEmbedResolver,
} from '../embeds/tableau.js'
import { tedEmbedResolver } from '../embeds/ted.js'
import {
  telegramIframeEmbedResolver,
  telegramS9eEmbedResolver,
  telegramScriptEmbedResolver,
} from '../embeds/telegram.js'
import { tencentEmbedResolver } from '../embeds/tencent.js'
import { tenorIframeEmbedResolver, tenorWidgetEmbedResolver } from '../embeds/tenor.js'
import { thinglinkEmbedResolver } from '../embeds/thinglink.js'
import { tickettailorScriptEmbedResolver } from '../embeds/tickettailor.js'
import {
  tiktokBlockquoteEmbedResolver,
  tiktokIframeEmbedResolver,
  tiktokS9eEmbedResolver,
} from '../embeds/tiktok.js'
import { tmzEmbedResolver } from '../embeds/tmz.js'
import { traileraddictEmbedResolver } from '../embeds/traileraddict.js'
import { transistorEmbedResolver } from '../embeds/transistor.js'
import { tumblrIframeEmbedResolver, tumblrPostEmbedResolver } from '../embeds/tumblr.js'
import { tuneinEmbedResolver } from '../embeds/tunein.js'
import {
  twitterAmpEmbedResolver,
  twitterBlockquoteEmbedResolver,
  twitterIframeEmbedResolver,
  twitterS9eEmbedResolver,
  twitterSubstackEmbedResolver,
} from '../embeds/twitter.js'
import { typeformIframeEmbedResolver, typeformWidgetEmbedResolver } from '../embeds/typeform.js'
import { ultimediaEmbedResolver } from '../embeds/ultimedia.js'
import { umapEmbedResolver } from '../embeds/umap.js'
import { videaEmbedResolver } from '../embeds/videa.js'
import {
  videopressFlashEmbedResolver,
  videopressIframeEmbedResolver,
} from '../embeds/videopress.js'
import {
  vidyardIframeEmbedResolver,
  vidyardImageEmbedResolver,
  vidyardScriptEmbedResolver,
} from '../embeds/vidyard.js'
import { vimeoEmbedResolver } from '../embeds/vimeo.js'
import { vkEmbedResolver } from '../embeds/vk.js'
import { vokiFlashEmbedResolver, vokiIframeEmbedResolver } from '../embeds/voki.js'
import { wakeletEmbedResolver } from '../embeds/wakelet.js'
import { washingtonpostEmbedResolver } from '../embeds/washingtonpost.js'
import { wikimediaEmbedResolver } from '../embeds/wikimedia.js'
import { wistiaEmbedResolver } from '../embeds/wistia.js'
import { wordwallEmbedResolver } from '../embeds/wordwall.js'
import {
  yandexMapsIframeEmbedResolver,
  yandexMapsScriptEmbedResolver,
} from '../embeds/yandexmaps.js'
import { youkuEmbedResolver } from '../embeds/youku.js'
import {
  youtubeAmpEmbedResolver,
  youtubeFc2EmbedResolver,
  youtubeIframeEmbedResolver,
} from '../embeds/youtube.js'
import { yumpuEmbedResolver } from '../embeds/yumpu.js'
import { zencastrBlockquoteEmbedResolver, zencastrIframeEmbedResolver } from '../embeds/zencastr.js'
import { zenoEmbedResolver } from '../embeds/zeno.js'
import { zohoworkdriveEmbedResolver } from '../embeds/zohoworkdrive.js'
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
import {
  onePixelOutFlashMediaResolver,
  onePixelOutWidgetMediaResolver,
} from '../media/1pixelout.js'
import { discourseMediaResolver } from '../media/discourse.js'
import { flashMp3PlayerMediaResolver } from '../media/flashmp3player.js'
import { ghostMediaResolver } from '../media/ghost.js'
import { odeoMediaResolver } from '../media/odeo.js'
import { podloveMediaResolver } from '../media/podlove.js'
import { substackMediaResolver } from '../media/substack.js'
import { tumblrMediaResolver } from '../media/tumblr.js'
import { wechatMediaResolver } from '../media/wechat.js'
import { weeblyFlashMediaResolver, weeblyMediaResolver } from '../media/weebly.js'
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
  oneTwoThreeFormBuilderScriptEmbedResolver,
  oneTwoThreeFormBuilderIframeEmbedResolver,
  channelOneEmbedResolver,
  threeSixtyCitiesEmbedResolver,
  abcnewsEmbedResolver,
  abcotvEmbedResolver,
  acastEmbedResolver,
  acuityschedulingEmbedResolver,
  allocineEmbedResolver,
  amebaImagePageEmbedResolver,
  amebaMoviePlayerEmbedResolver,
  amebaReblogCardEmbedResolver,
  anchorEmbedResolver,
  aparatIframeEmbedResolver,
  aparatScriptEmbedResolver,
  appleEmbedResolver,
  appleToolsEmbedResolver,
  arcgisEmbedResolver,
  archiveIframeEmbedResolver,
  archiveFlashEmbedResolver,
  ardmediathekEmbedResolver,
  art19EmbedResolver,
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
  brEmbedResolver,
  bridEmbedResolver,
  brightcoveExperienceEmbedResolver,
  brightcoveFlashEmbedResolver,
  brightcoveIframeEmbedResolver,
  brightcoveVideoJsEmbedResolver,
  bundestagIframeEmbedResolver,
  bundestagScriptEmbedResolver,
  buzzsproutIframeEmbedResolver,
  buzzsproutScriptEmbedResolver,
  calameoEmbedResolver,
  canaluEmbedResolver,
  canvaIframeEmbedResolver,
  canvaWidgetEmbedResolver,
  captivateEmbedResolver,
  ccmaEmbedResolver,
  channel9EmbedResolver,
  cloudflarestreamIframeEmbedResolver,
  cloudflarestreamScriptEmbedResolver,
  cnbcIframeEmbedResolver,
  cnnScriptEmbedResolver,
  cnnFlashEmbedResolver,
  cnnIframeEmbedResolver,
  codepenWidgetEmbedResolver,
  codepenIframeEmbedResolver,
  codesandboxIframeEmbedResolver,
  cognitoformsScriptEmbedResolver,
  cognitoformsIframeEmbedResolver,
  condenastIframeEmbedResolver,
  condenastScriptEmbedResolver,
  corriereEmbedResolver,
  crowdsignalFlashEmbedResolver,
  crowdsignalIframeEmbedResolver,
  crowdsignalScriptEmbedResolver,
  cspanEmbedResolver,
  dailymailEmbedResolver,
  dailymotionEmbedResolver,
  deezerEmbedResolver,
  democracynowEmbedResolver,
  documentcloudEmbedResolver,
  donorboxEmbedResolver,
  dvidsEmbedResolver,
  educaplayEmbedResolver,
  facebookWidgetEmbedResolver,
  facebookIframeEmbedResolver,
  facebookS9eEmbedResolver,
  facebookBlockquoteEmbedResolver,
  facebookXfbmlEmbedResolver,
  facebookAmpEmbedResolver,
  fc2PlayerScriptEmbedResolver,
  fc2BlogScriptEmbedResolver,
  fc2IframeEmbedResolver,
  fc2FlashEmbedResolver,
  figmaEmbedResolver,
  figshareEmbedResolver,
  firesideEmbedResolver,
  firstoryEmbedResolver,
  flickrEmbedResolver,
  fliphtml5IframeEmbedResolver,
  fliphtml5LightBoxEmbedResolver,
  flipsnackEmbedResolver,
  flourishWidgetEmbedResolver,
  flourishIframeEmbedResolver,
  formmailerWidgetEmbedResolver,
  formmailerIframeEmbedResolver,
  foxnewsScriptEmbedResolver,
  foxnewsIframeEmbedResolver,
  ganjingworldEmbedResolver,
  garminEmbedResolver,
  geniallyEmbedResolver,
  geogebraEmbedResolver,
  gettyImagesEmbedResolver,
  glomexIframeEmbedResolver,
  glomexElementEmbedResolver,
  googlebooksEmbedResolver,
  googledriveEmbedResolver,
  googleformsEmbedResolver,
  googleslidesEmbedResolver,
  guardianEmbedResolver,
  hearthisEmbedResolver,
  helloassoEmbedResolver,
  heyzineEmbedResolver,
  iheartEmbedResolver,
  imdbEmbedResolver,
  imgurBlockquoteEmbedResolver,
  imgurIframeEmbedResolver,
  imgurS9eEmbedResolver,
  inaEmbedResolver,
  inaScriptEmbedResolver,
  indavideoEmbedResolver,
  infogramIframeEmbedResolver,
  infogramScriptEmbedResolver,
  infogramWidgetEmbedResolver,
  instagramBlockquoteEmbedResolver,
  instagramAmpEmbedResolver,
  instagramSubstackEmbedResolver,
  instagramIframeEmbedResolver,
  instagramS9eEmbedResolver,
  ispotEmbedResolver,
  issuuWidgetEmbedResolver,
  issuuIframeEmbedResolver,
  ivooxEmbedResolver,
  jotformScriptEmbedResolver,
  jotformIframeEmbedResolver,
  jwplayerIframeEmbedResolver,
  jwplayerScriptEmbedResolver,
  jwplayerAmpEmbedResolver,
  jwplayerSetupEmbedResolver,
  kalturaIframeEmbedResolver,
  kalturaScriptEmbedResolver,
  kindleEmbedResolver,
  komootEmbedResolver,
  learningappsEmbedResolver,
  lglformsScriptEmbedResolver,
  lglformsIframeEmbedResolver,
  libsynEmbedResolver,
  linkedinEmbedResolver,
  listennotesEmbedResolver,
  mailruEmbedResolver,
  matterportEmbedResolver,
  mediacccEmbedResolver,
  mediavineWidgetEmbedResolver,
  mediavineScriptEmbedResolver,
  megaphoneEmbedResolver,
  megatvEmbedResolver,
  mixcloudEmbedResolver,
  mrcvideoEmbedResolver,
  mrcvideoFlashEmbedResolver,
  namashaEmbedResolver,
  nbcnewsEmbedResolver,
  neteaseEmbedResolver,
  nicovideoScriptEmbedResolver,
  nicovideoIframeEmbedResolver,
  notecomIframeEmbedResolver,
  nprFlashEmbedResolver,
  nprIframeEmbedResolver,
  nytimesIframeEmbedResolver,
  observableEmbedResolver,
  odnoklassnikiEmbedResolver,
  odyseeEmbedResolver,
  officeEmbedResolver,
  omnyEmbedResolver,
  opendriveEmbedResolver,
  ourworldindataEmbedResolver,
  padletEmbedResolver,
  pastebinIframeEmbedResolver,
  pastebinScriptEmbedResolver,
  patroniteEmbedResolver,
  pbsFlashEmbedResolver,
  pbsIframeEmbedResolver,
  pbsLegacyIframeEmbedResolver,
  piktochartIframeEmbedResolver,
  pinecastEmbedResolver,
  pixivIframeEmbedResolver,
  pixivScriptEmbedResolver,
  podbeanEmbedResolver,
  podcloudIframeEmbedResolver,
  podcloudWidgetEmbedResolver,
  podetizeScriptEmbedResolver,
  podetizeIframeEmbedResolver,
  podigeeScriptEmbedResolver,
  podigeeIframeEmbedResolver,
  podomaticEmbedResolver,
  preziEmbedResolver,
  puzzlemeEmbedResolver,
  puzzlemeWidgetEmbedResolver,
  radioradicaleEmbedResolver,
  redcircleScriptEmbedResolver,
  redcircleIframeEmbedResolver,
  redditWidgetEmbedResolver,
  redditIframeEmbedResolver,
  redditS9eEmbedResolver,
  reverbnationEmbedResolver,
  ridewithgpsEmbedResolver,
  rsscomEmbedResolver,
  rtveIframeEmbedResolver,
  rtveFlashEmbedResolver,
  rutubeEmbedResolver,
  scratchEmbedResolver,
  scribdFlashEmbedResolver,
  scribdIframeEmbedResolver,
  simplecastEmbedResolver,
  sketchfabEmbedResolver,
  slideserveEmbedResolver,
  slideshareFlashEmbedResolver,
  slideshareIframeEmbedResolver,
  soundcloudEmbedResolver,
  speakerdeckScriptEmbedResolver,
  speakerdeckIframeEmbedResolver,
  spotifyEmbedResolver,
  spreakerIframeEmbedResolver,
  spreakerAnchorEmbedResolver,
  srgplayEmbedResolver,
  stackblitzIframeEmbedResolver,
  standfmEmbedResolver,
  steamEmbedResolver,
  stravaIframeEmbedResolver,
  stravaPlaceholderEmbedResolver,
  strawpollIframeEmbedResolver,
  strawpollMountEmbedResolver,
  subsplashEmbedResolver,
  swayEmbedResolver,
  symbalooEmbedResolver,
  tableauWidgetEmbedResolver,
  tableauObjectEmbedResolver,
  tableauIframeEmbedResolver,
  tedEmbedResolver,
  telegramScriptEmbedResolver,
  telegramIframeEmbedResolver,
  telegramS9eEmbedResolver,
  tencentEmbedResolver,
  tenorIframeEmbedResolver,
  tenorWidgetEmbedResolver,
  thinglinkEmbedResolver,
  tickettailorScriptEmbedResolver,
  tiktokBlockquoteEmbedResolver,
  tiktokIframeEmbedResolver,
  tiktokS9eEmbedResolver,
  tmzEmbedResolver,
  traileraddictEmbedResolver,
  transistorEmbedResolver,
  tumblrIframeEmbedResolver,
  tumblrPostEmbedResolver,
  tuneinEmbedResolver,
  twitterBlockquoteEmbedResolver,
  twitterAmpEmbedResolver,
  twitterSubstackEmbedResolver,
  twitterIframeEmbedResolver,
  twitterS9eEmbedResolver,
  typeformWidgetEmbedResolver,
  typeformIframeEmbedResolver,
  ultimediaEmbedResolver,
  videaEmbedResolver,
  videopressIframeEmbedResolver,
  videopressFlashEmbedResolver,
  vidyardIframeEmbedResolver,
  vidyardImageEmbedResolver,
  vidyardScriptEmbedResolver,
  vimeoEmbedResolver,
  vkEmbedResolver,
  vokiFlashEmbedResolver,
  vokiIframeEmbedResolver,
  wakeletEmbedResolver,
  washingtonpostEmbedResolver,
  wistiaEmbedResolver,
  wordwallEmbedResolver,
  yandexMapsIframeEmbedResolver,
  yandexMapsScriptEmbedResolver,
  youkuEmbedResolver,
  youtubeIframeEmbedResolver,
  youtubeAmpEmbedResolver,
  youtubeFc2EmbedResolver,
  yumpuEmbedResolver,
  zencastrBlockquoteEmbedResolver,
  zencastrIframeEmbedResolver,
  zenoEmbedResolver,
  zohoworkdriveEmbedResolver,

  // Last, outside the alphabet: keyed on a path shape rather than a host, so every resolver
  // naming a host gets the carrier first.
  mastodonEmbedResolver,
  wikimediaEmbedResolver,
  peertubeEmbedResolver,
  umapEmbedResolver,
]

// Alphabetical by platform. Wikimedia's bare `iframe` selector sits last so a host-keyed
// resolver gets the carrier first.
const mediaResolvers: Array<MediaResolver> = [
  onePixelOutFlashMediaResolver,
  onePixelOutWidgetMediaResolver,
  discourseMediaResolver,
  flashMp3PlayerMediaResolver,
  ghostMediaResolver,
  odeoMediaResolver,
  podloveMediaResolver,
  substackMediaResolver,
  tumblrMediaResolver,
  wechatMediaResolver,
  weeblyMediaResolver,
  weeblyFlashMediaResolver,
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
  wordpressCiteResolver,
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
