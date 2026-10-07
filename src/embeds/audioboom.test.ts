import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  audioboomFlashEmbedResolver,
  audioboomIframeEmbedResolver,
  audioboomResolveEmbed,
  audioboomWidgetEmbedResolver,
  extractAudioboomPost,
} from './audioboom.js'

describe('extractAudioboomPost', () => {
  it('should read the current player', () => {
    const value = 'https://embeds.audioboom.com/posts/8292430/embed/v4'
    const expected = { id: '8292430', isCurrent: true }

    expect(extractAudioboomPost(value)).toEqual(expected)
  })

  it('should read the compact player', () => {
    const value = 'https://embeds.audioboom.com/posts/8292430/embed'
    const expected = { id: '8292430', isCurrent: false }

    expect(extractAudioboomPost(value)).toEqual(expected)
  })

  it('should read the pre-rename boos spelling', () => {
    const value = 'https://audioboo.fm/boos/123456/embed'
    const expected = { id: '123456', isCurrent: false }

    expect(extractAudioboomPost(value)).toEqual(expected)
  })

  it('should drop the episode slug the share code hangs off the id', () => {
    const value =
      'https://embeds.audioboom.com/posts/6479208-eddie-jones-england-s-forward-power/embed/v4'
    const expected = { id: '6479208', isCurrent: true }

    expect(extractAudioboomPost(value)).toEqual(expected)
  })

  it('should drop the episode slug on the pre-rename boos spelling too', () => {
    const value = 'https://audioboo.fm/boos/2682680-joyous-jingles/embed'
    const expected = { id: '2682680', isCurrent: false }

    expect(extractAudioboomPost(value)).toEqual(expected)
  })

  it('should return undefined for a segment that starts with the slug', () => {
    const value = 'https://embeds.audioboom.com/posts/joyous-jingles/embed'

    expect(extractAudioboomPost(value)).toBeUndefined()
  })

  it('should return undefined for an audioboom url naming no post', () => {
    const value = 'https://audioboom.com/channels/something'

    expect(extractAudioboomPost(value)).toBeUndefined()
  })

  it('should return undefined for a url that cannot be parsed', () => {
    const value = 'https://['

    expect(extractAudioboomPost(value)).toBeUndefined()
  })
})

describe('audioboomResolveEmbed', () => {
  // The url names the player version and the version decides the height.
  it('should size the current player at its own height', () => {
    const value = 'https://embeds.audioboom.com/posts/8292430/embed/v4'
    const expected: EmbedResolverResult = {
      provider: 'audioboom',
      id: '8292430',
      src: 'https://embeds.audioboom.com/posts/8292430/embed/v4',
      height: 300,
    }

    expect(audioboomResolveEmbed(value)).toEqual(expected)
  })

  it('should size the compact player shorter', () => {
    const value = 'https://embeds.audioboom.com/posts/8292430/embed'
    const expected: EmbedResolverResult = {
      provider: 'audioboom',
      id: '8292430',
      src: 'https://embeds.audioboom.com/posts/8292430/embed',
      height: 95,
    }

    expect(audioboomResolveEmbed(value)).toEqual(expected)
  })

  it('should mint the bare id from a slugged url', () => {
    const value =
      'https://embeds.audioboom.com/posts/6479208-eddie-jones-england-s-forward-power/embed/v4'
    const expected: EmbedResolverResult = {
      provider: 'audioboom',
      id: '6479208',
      src: 'https://embeds.audioboom.com/posts/6479208/embed/v4',
      height: 300,
    }

    expect(audioboomResolveEmbed(value)).toEqual(expected)
  })

  it('should return undefined for a audioboom url naming no post', () => {
    const value = 'https://audioboom.com/about'

    expect(audioboomResolveEmbed(value)).toBeUndefined()
  })
})

describeForEachParser('audioboomWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, audioboomWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should read the player url the plugin parks on its own div', async () => {
      const value = html`
        <div
          class="ab-player"
          data-boourl="https://audioboo.fm/boos/2158735-rty-at-ictedu-conference/embed/v2?eid=AQAAAKtDe1OP8CAA"
        >
          <a href="https://audioboo.fm/boos/2158735-rty-at-ictedu-conference">listen on Audioboo</a>
        </div>
      `
      const expected: EmbedResolverResult = {
        provider: 'audioboom',
        id: '2158735',
        src: 'https://embeds.audioboom.com/posts/2158735/embed',
        height: 95,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a protocol-relative player url', async () => {
      const value = html`
        <div
          class="ab-player"
          data-boourl="//embeds.audioboom.com/posts/8292430/embed/v4"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'audioboom',
        id: '8292430',
        src: 'https://embeds.audioboom.com/posts/8292430/embed/v4',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host parked in the same attribute', async () => {
      const value = html`
        <div
          class="ab-player"
          data-boourl="https://evil.test/boos/2158735/embed"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a div whose attribute names no post', async () => {
      const value =
        '<div class="ab-player" data-boourl="https://audioboom.com/channels/news"></div>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('audioboomFlashEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, audioboomFlashEmbedResolver)

  describe('happy paths', () => {
    it('should read the post page the player names on its own host', async () => {
      const value = html`
        <object
          type="application/x-shockwave-flash"
          data="http://boos.audioboo.fm/swf/fullsize_player.swf"
          height="129"
          width="400"
        >
          <param value="http://boos.audioboo.fm/swf/fullsize_player.swf" name="movie" />
          <param value="noscale" name="scale" />
          <param
            value="mp3=http%3A%2F%2Faudioboo.fm%2Fboos%2F88571-andrew-s-tech-entrepreneur-silicon-valley.mp3&mp3Author=maaritroiha&mp3LinkURL=http%3A%2F%2Faudioboo.fm%2Fboos%2F88571-andrew-s-tech-entrepreneur-silicon-valley&mp3Title=Andrew+S%2C+tech+entrepreneur%2C+Silicon+Valley&mp3Time=01.17pm+03+Jan+2010"
            name="FlashVars"
          />
          <a href="http://audioboo.fm/boos/88571-andrew-s-tech-entrepreneur-silicon-valley.mp3">Listen!</a>
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'audioboom',
        id: '88571',
        src: 'https://embeds.audioboom.com/posts/88571/embed/v4',
        height: 300,
        title: 'Andrew S, tech entrepreneur, Silicon Valley',
        author: 'maaritroiha',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the player served from the S3 bucket', async () => {
      const value = html`
        <object
          data="http://abfiles.s3.amazonaws.com/swf/fullsize_player.swf"
          height="129"
          id="boo_embed_695470"
          type="application/x-shockwave-flash"
          width="400"
        >
          <param name="movie" value="http://abfiles.s3.amazonaws.com/swf/fullsize_player.swf" />
          <param
            name="FlashVars"
            value="mp3=http%3A%2F%2Faudioboo.fm%2Fboos%2F695470-9-ways-to-avoid-being-a-victim-of-a-tax-scam.mp3%3Fkeyed%3Dtrue%26source%3Dembed&mp3Title=9+Ways+to+Avoid+Being+a+Victim+of+a+Tax+Scam&mp3Time=06.55pm+03+Mar+2012&mp3LinkURL=http%3A%2F%2Faudioboo.fm%2Fboos%2F695470-9-ways-to-avoid-being-a-victim-of-a-tax-scam&mp3Author=TechAccountant&rootID=boo_embed_695470"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'audioboom',
        id: '695470',
        src: 'https://embeds.audioboom.com/posts/695470/embed/v4',
        height: 300,
        title: '9 Ways to Avoid Being a Victim of a Tax Scam',
        author: 'TechAccountant',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the flashvars an embed carries on itself', async () => {
      const value = html`
        <embed
          id="boo_embed_1078895"
          type="application/x-shockwave-flash"
          width="400"
          height="225"
          src="http://abfiles.s3.amazonaws.com/swf/fullsize_player.swf"
          flashvars="mp3=http%3A%2F%2Faudioboo.fm%2Fboos%2F1078895-test-audioboo.mp3%3Fkeyed%3Dtrue%26source%3Dembed&amp;mp3Title=Test+Audioboo&amp;mp3Time=09.42pm+25+Nov+2012&amp;mp3LinkURL=http%3A%2F%2Faudioboo.fm%2Fboos%2F1078895-test-audioboo&amp;mp3Author=ropofam&amp;rootID=boo_embed_1078895"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'audioboom',
        id: '1078895',
        src: 'https://embeds.audioboom.com/posts/1078895/embed/v4',
        height: 300,
        title: 'Test Audioboo',
        author: 'ropofam',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the post off the audio file when the player names no page', async () => {
      const value = html`
        <object
          data="http://boos.audioboo.fm/player_mp3.swf"
          type="application/x-shockwave-flash"
          width="390"
          height="104"
        >
          <param name="movie" value="http://boos.audioboo.fm/player_mp3.swf">
          <param name="FlashVars" value="mp3=http://audioboo.fm/boos/10535-test-for-hawai-i-arts-workshop.mp3">
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'audioboom',
        id: '10535',
        src: 'https://embeds.audioboom.com/posts/10535/embed/v4',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the post off an audio file url carrying a query', async () => {
      const value = html`
        <object data="http://abfiles.s3.amazonaws.com/swf/fullsize_player.swf">
          <param
            name="FlashVars"
            value="mp3=http%3A%2F%2Faudioboo.fm%2Fboos%2F695470-9-ways-to-avoid-being-a-victim-of-a-tax-scam.mp3%3Fkeyed%3Dtrue%26source%3Dembed"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'audioboom',
        id: '695470',
        src: 'https://embeds.audioboom.com/posts/695470/embed/v4',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should prefer the post page over the audio file', async () => {
      const value = html`
        <object data="http://boos.audioboo.fm/swf/fullsize_player.swf">
          <param
            name="FlashVars"
            value="mp3=http%3A%2F%2Faudioboo.fm%2Fboos%2F1095890-the-future-of-listening.mp3&mp3LinkURL=http%3A%2F%2Faudioboo.fm%2Fboos%2F695470-9-ways-to-avoid-being-a-victim-of-a-tax-scam"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'audioboom',
        id: '695470',
        src: 'https://embeds.audioboom.com/posts/695470/embed/v4',
        height: 300,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the same player on a foreign host', async () => {
      const value = html`
        <object data="https://evil.test/swf/fullsize_player.swf">
          <param
            name="FlashVars"
            value="mp3LinkURL=http%3A%2F%2Faudioboo.fm%2Fboos%2F695470-9-ways-to-avoid-being-a-victim-of-a-tax-scam"
          />
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player with no flashvars', async () => {
      const value = '<object data="http://boos.audioboo.fm/swf/fullsize_player.swf"></object>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player whose flashvars name no post', async () => {
      const value = html`
        <object data="http://boos.audioboo.fm/swf/fullsize_player.swf">
          <param name="FlashVars" value="mp3LinkURL=http%3A%2F%2Faudioboo.fm%2Fusers%2Fmaaritroiha">
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('audioboom through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should claim a slugged player url framed as an embed', async () => {
    const value = html`
      <iframe
        src="https://embeds.audioboom.com/posts/6479208-eddie-jones-england-s-forward-power/embed/v4"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-id="6479208"
        data-embed-provider="audioboom"
        data-embed-src="https://embeds.audioboom.com/posts/6479208/embed/v4"
        data-embed-height="300"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should replace the Flash player with the current one', async () => {
    const value = html`
      <p>
        <object
          type="application/x-shockwave-flash"
          data="http://boos.audioboo.fm/swf/fullsize_player.swf"
          height="129"
          width="400"
        >
          <param value="http://boos.audioboo.fm/swf/fullsize_player.swf" name="movie" />
          <param
            value="mp3=http%3A%2F%2Faudioboo.fm%2Fboos%2F88571-andrew-s-tech-entrepreneur-silicon-valley.mp3&mp3Author=maaritroiha&mp3LinkURL=http%3A%2F%2Faudioboo.fm%2Fboos%2F88571-andrew-s-tech-entrepreneur-silicon-valley&mp3Title=Andrew+S%2C+tech+entrepreneur%2C+Silicon+Valley&mp3Time=01.17pm+03+Jan+2010"
            name="FlashVars"
          />
          <a href="http://audioboo.fm/boos/88571-andrew-s-tech-entrepreneur-silicon-valley.mp3">Listen!</a>
        </object>
      </p>
    `
    const expected = html`
      <div
        data-embed-id="88571"
        data-embed-provider="audioboom"
        data-embed-src="https://embeds.audioboom.com/posts/88571/embed/v4"
        data-embed-height="300"
        data-embed-title="Andrew S, tech entrepreneur, Silicon Valley"
        data-embed-author="maaritroiha"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  // The episode audio sits on the same host and under the same path as the player, and differs
  // only by its extension, so the enclosure probe offers it to this resolver on every feed.
  it('should leave an audioboom audio enclosure playable', async () => {
    const enclosures = [
      {
        url: 'https://audioboom.com/posts/8292430-the-tv-listings-guides-of-christmas-past.mp3',
        type: 'audio/mpeg',
      },
    ]

    const expected = html`
      <audio data-enclosure="" controls src="https://audioboom.com/posts/8292430-the-tv-listings-guides-of-christmas-past.mp3"></audio>
      <p>Body</p>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})

describeForEachParser('audioboomIframeEmbedResolver carrier title', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, audioboomIframeEmbedResolver)

  it('should drop the label the player writes in place of the name', async () => {
    const value = html`
      <iframe src="https://embeds.audioboom.com/posts/8292430/embed/v4" title="audioBoom player"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'audioboom',
      id: '8292430',
      src: 'https://embeds.audioboom.com/posts/8292430/embed/v4',
      height: 300,
    }

    expect(await extract(value)).toEqual(expected)
  })

  it('should read the name the carrier states', async () => {
    const value = html`
      <iframe src="https://embeds.audioboom.com/posts/8292430/embed/v4" title="The Rest Is History: Rome"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'audioboom',
      id: '8292430',
      src: 'https://embeds.audioboom.com/posts/8292430/embed/v4',
      height: 300,
      title: 'The Rest Is History: Rome',
    }

    expect(await extract(value)).toEqual(expected)
  })
})
