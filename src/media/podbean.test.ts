import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { MediaResolverResult } from '../types.js'
import { podbeanFlashMediaResolver } from './podbean.js'

describeForEachParser('podbeanFlashMediaResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, podbeanFlashMediaResolver)

  describe('happy paths', () => {
    it('should play the file the embed names in audioPath', async () => {
      const value = html`
        <embed
          src="http://www.podbean.com/podcast-audio-video-blog-player/mp3playerlightsmallv3.swf?audioPath=http://musicalhotspot.podbean.com/mf/play/xv83p8/PrognosisDeathCharacterThemes.mp3&autoStart=no"
          width="210"
          height="25"
          name="mp3playerlightsmallv3"
          type="application/x-shockwave-flash"
        />
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://musicalhotspot.podbean.com/mf/play/xv83p8/PrognosisDeathCharacterThemes.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should play the file the object names in its data url', async () => {
      const value = html`
        <object
          width="210"
          height="25"
          data="http://www.podbean.com/podcast-audio-video-blog-player/mp3playerlightsmallv3.swf?audioPath=http://politicalaffairs.podbean.com/mf/play/67jjt/BoycottingJimCrow_TheOriginalAnti-SegregationMovement-Episode126.mp3&amp;autoStart=no"
          type="application/x-shockwave-flash"
        ></object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://politicalaffairs.podbean.com/mf/play/67jjt/BoycottingJimCrow_TheOriginalAnti-SegregationMovement-Episode126.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should pass a file on another host as written', async () => {
      const value = html`
        <embed
          src="http://playlist.podbean.com/podcast-audio-video-blog-player/mp3playerdarksmallv3.swf?audioPath=http://www.podtrac.com/pts/redirect.mp3/recordings.talkshoe.com/TC-124173/TS-998476.mp3&autoStart=no"
          type="application/x-shockwave-flash"
        />
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://www.podtrac.com/pts/redirect.mp3/recordings.talkshoe.com/TC-124173/TS-998476.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the Internet Explorer object with no embed', () => {
    it('should play the file the movie param names', async () => {
      const value = html`
        <object
          align="middle"
          althtml="&lt;embed src=&quot;http://www.podbean.com/podcast-audio-video-blog-player/mp3playerlightsmallv3.swf?"
          classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"
          codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0"
          height="25"
          id="mp3playerlightsmallv3"
          width="210"
        >
          <param NAME="FlashVars" VALUE="">
          <param
            NAME="Movie"
            VALUE="http://www.podbean.com/podcast-audio-video-blog-player/mp3playerlightsmallv3.swf?audioPath=http://darkbeige.podbean.com/mf/play/32ibxt/Interval-UnitedKingdomNILPOINTS.mp3&amp;autoStart=no"
          >
          <param NAME="WMode" VALUE="Transparent">
          <param NAME="AllowScriptAccess" VALUE="sameDomain">
        </object>
      `
      const expected: MediaResolverResult = {
        tag: 'audio',
        src: 'http://darkbeige.podbean.com/mf/play/32ibxt/Interval-UnitedKingdomNILPOINTS.mp3',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a player naming a playlist and no file', async () => {
      const value = html`
        <embed
          src="http://www.podbean.com/podcast-audio-video-blog-player/mp3playerdarkv3.swf?playlist=http://www.podbean.com/podcast-blog-embeddable-flash-player-playlist2/blogs18/284042/playlist/Intercession61754.xml"
          type="application/x-shockwave-flash"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the same path', async () => {
      const value = html`
        <embed
          src="http://evil.test/podcast-audio-video-blog-player/mp3playerlightsmallv3.swf?audioPath=http://example.com/a.mp3&r=podbean.com/podcast-audio-video-blog-player/"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore another route on the podbean host', async () => {
      const value = html`
        <embed
          src="http://www.podbean.com/x/mp3playerlightsmallv3.swf?audioPath=http://example.com/a.mp3&r=podbean.com/podcast-audio-video-blog-player/"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('podbean Flash players through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should turn the object and embed pair into one audio element', async () => {
    const value = html`
      <object
        align="middle"
        classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"
        codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0"
        height="25"
        id="mp3playerdarksmallv3"
        width="210"
      >
        <param name="allowScriptAccess" value="sameDomain" />
        <param
          name="movie"
          value="http://www.podbean.com/podcast-audio-video-blog-player/mp3playerdarksmallv3.swf?audioPath=http://shambles.podbean.com/mf/play/yt829n/egg170309.mp3&autoStart=no"
        />
        <param name="quality" value="high" />
        <param name="wmode" value="transparent" />
        <embed
          src="http://www.podbean.com/podcast-audio-video-blog-player/mp3playerdarksmallv3.swf?audioPath=http://shambles.podbean.com/mf/play/yt829n/egg170309.mp3&autoStart=no"
          quality="high"
          width="210"
          height="25"
          name="mp3playerdarksmallv3"
          align="middle"
          allowScriptAccess="sameDomain"
          wmode="transparent"
          type="application/x-shockwave-flash"
          pluginspage="http://www.macromedia.com/go/getflashplayer"
        />
      </object>
    `
    const expected = html`
      <audio controls src="http://shambles.podbean.com/mf/play/yt829n/egg170309.mp3"></audio>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should replace the whole object when the editor put line breaks inside it', async () => {
    const value = html`
      <object
        classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"
        codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0"
        width="210"
        height="25"
        id="mp3playerlightsmallv3"
        align="middle"
      >
        <br />
        <param name="allowScriptAccess" value="sameDomain" />
        <br />
        <param
          name="movie"
          value="http://www.podbean.com/podcast-audio-video-blog-player/mp3playerlightsmallv3.swf?audioPath=http://improvisednewyork.podbean.com/mf/play/qxrwt/INY-Episode1.mp3&autoStart=no"
        />
        <br />
        <embed
          src="http://www.podbean.com/podcast-audio-video-blog-player/mp3playerlightsmallv3.swf?audioPath=http://improvisednewyork.podbean.com/mf/play/qxrwt/INY-Episode1.mp3&autoStart=no"
          width="210"
          height="25"
          name="mp3playerlightsmallv3"
          type="application/x-shockwave-flash"
        />
        <br />
      </object>
    `
    const expected = html`
      <audio controls src="http://improvisednewyork.podbean.com/mf/play/qxrwt/INY-Episode1.mp3"></audio>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
