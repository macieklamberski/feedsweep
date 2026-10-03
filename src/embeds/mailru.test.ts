import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { mailruEmbedResolver, mailruResolveEmbed } from './mailru.js'

describe('mailruResolveEmbed', () => {
  describe('happy paths', () => {
    it('should take the numeric id the share dialog writes', () => {
      const value = 'https://my.mail.ru/video/embed/253943806846567285'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: '253943806846567285',
        src: 'https://my.mail.ru/video/embed/253943806846567285',
        ratio: '16/9',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the sign of a negative id', () => {
      const value = 'https://my.mail.ru/video/embed/-16687799075863114'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: '-16687799075863114',
        src: 'https://my.mail.ru/video/embed/-16687799075863114',
        ratio: '16/9',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should move the dead api host onto the player that serves the same path', () => {
      const value = 'http://api.video.mail.ru/videos/embed/corp/lady/86/753.html'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'corp/lady/86/753',
        src: 'https://my.mail.ru/corp/lady/video/embed/86/753',
        url: 'https://my.mail.ru/corp/lady/video/86/753.html',
        ratio: '16/9',
        author: 'lady',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the end of the redirect the videoapi host sends', () => {
      const value = 'https://videoapi.my.mail.ru/videos/embed/mail/eduspb.com/_myvideo/248.html'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'mail/eduspb.com/_myvideo/248',
        src: 'https://my.mail.ru/mail/eduspb.com/video/embed/_myvideo/248',
        url: 'https://my.mail.ru/mail/eduspb.com/video/_myvideo/248.html',
        ratio: '16/9',
        author: 'eduspb.com',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should read the path form the player already serves', () => {
      const value = 'https://my.mail.ru/mail/shels_1991/video/embed/20/885'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'mail/shels_1991/20/885',
        src: 'https://my.mail.ru/mail/shels_1991/video/embed/20/885',
        url: 'https://my.mail.ru/mail/shels_1991/video/20/885.html',
        ratio: '16/9',
        author: 'shels_1991',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should read the path form whose user carries a dot', () => {
      const value = 'https://my.mail.ru/mail/eduspb.com/video/embed/_myvideo/199'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'mail/eduspb.com/_myvideo/199',
        src: 'https://my.mail.ru/mail/eduspb.com/video/embed/_myvideo/199',
        url: 'https://my.mail.ru/mail/eduspb.com/video/_myvideo/199.html',
        ratio: '16/9',
        author: 'eduspb.com',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should read the path form whose user carries a hyphen', () => {
      const value = 'https://my.mail.ru/mail/art-ifact/video/embed/kvantovaya_realnost/382'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'mail/art-ifact/kvantovaya_realnost/382',
        src: 'https://my.mail.ru/mail/art-ifact/video/embed/kvantovaya_realnost/382',
        url: 'https://my.mail.ru/mail/art-ifact/video/kvantovaya_realnost/382.html',
        ratio: '16/9',
        author: 'art-ifact',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should move the dead api host onto the player for an album carrying a hyphen', () => {
      const value =
        'http://api.video.mail.ru/videos/embed/corp/hitech/news_hi-tech_mail_ru/1263.html'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'corp/hitech/news_hi-tech_mail_ru/1263',
        src: 'https://my.mail.ru/corp/hitech/video/embed/news_hi-tech_mail_ru/1263',
        url: 'https://my.mail.ru/corp/hitech/video/news_hi-tech_mail_ru/1263.html',
        ratio: '16/9',
        author: 'hitech',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    // The player finds the video by its counter and serves it under any album spelling.
    it('should move the dead api host onto the player for an album carrying a dot', () => {
      const value =
        'http://api.video.mail.ru/videos/embed/corp/hitech/news_hi.tech_mail_ru/1263.html'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'corp/hitech/news_hi.tech_mail_ru/1263',
        src: 'https://my.mail.ru/corp/hitech/video/embed/news_hi.tech_mail_ru/1263',
        url: 'https://my.mail.ru/corp/hitech/video/news_hi.tech_mail_ru/1263.html',
        ratio: '16/9',
        author: 'hitech',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should read the path form whose album carries a hyphen', () => {
      const value = 'https://my.mail.ru/corp/hitech/video/embed/news_hi-tech_mail_ru/1263'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'corp/hitech/news_hi-tech_mail_ru/1263',
        src: 'https://my.mail.ru/corp/hitech/video/embed/news_hi-tech_mail_ru/1263',
        url: 'https://my.mail.ru/corp/hitech/video/news_hi-tech_mail_ru/1263.html',
        ratio: '16/9',
        author: 'hitech',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should read the path form whose album carries a dot', () => {
      const value = 'https://my.mail.ru/corp/hitech/video/embed/news_hi.tech_mail_ru/1263'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'corp/hitech/news_hi.tech_mail_ru/1263',
        src: 'https://my.mail.ru/corp/hitech/video/embed/news_hi.tech_mail_ru/1263',
        url: 'https://my.mail.ru/corp/hitech/video/news_hi.tech_mail_ru/1263.html',
        ratio: '16/9',
        author: 'hitech',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should read the video the Flash player names on its query', () => {
      const value =
        'http://img.mail.ru/r/video2/uvpv3.swf?2&movieSrc=mail/anizm.com/4418/4427&autoplay=0'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'mail/anizm.com/4418/4427',
        src: 'https://my.mail.ru/mail/anizm.com/video/embed/4418/4427',
        url: 'https://my.mail.ru/mail/anizm.com/video/4418/4427.html',
        ratio: '16/9',
        author: 'anizm.com',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should read the video the older Flash player names in its par path', () => {
      const value =
        'http://img.mail.ru/r/video2/player_v2.swf?par=http://content.video.mail.ru/mail/gsavinich/10/$44$0$143'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'mail/gsavinich/10/44',
        src: 'https://my.mail.ru/mail/gsavinich/video/embed/10/44',
        url: 'https://my.mail.ru/mail/gsavinich/video/10/44.html',
        ratio: '16/9',
        author: 'gsavinich',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should read the par path of the full size Flash player', () => {
      const value =
        'http://img.mail.ru/r/video/player_full_size.swf?par=http://video.mail.ru/mail/vi-talik/kazantip-2006/$262$0$348'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'mail/vi-talik/kazantip-2006/262',
        src: 'https://my.mail.ru/mail/vi-talik/video/embed/kazantip-2006/262',
        url: 'https://my.mail.ru/mail/vi-talik/video/kazantip-2006/262.html',
        ratio: '16/9',
        author: 'vi-talik',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should read a par path whose dollar signs are percent-encoded', () => {
      const value =
        'http://img.mail.ru/r/video2/player_v2.swf?par=http://content.video.mail.ru/mail/pavelbazhenov/84/%2485%240%2451'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'mail/pavelbazhenov/84/85',
        src: 'https://my.mail.ru/mail/pavelbazhenov/video/embed/84/85',
        url: 'https://my.mail.ru/mail/pavelbazhenov/video/84/85.html',
        ratio: '16/9',
        author: 'pavelbazhenov',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', () => {
      const value = 'https://evil.test/video/embed/253943806846567285'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the watch page, which frames nothing', () => {
      const value = 'https://my.mail.ru/mail/shels_1991/video/20/885.html'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed numeric id as written, even if the player answers an error', () => {
      const value = 'https://my.mail.ru/video/embed/latest'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'latest',
        src: 'https://my.mail.ru/video/embed/latest',
        ratio: '16/9',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore the numeric route behind another segment', () => {
      const value = 'https://my.mail.ru/x/video/embed/253943806846567285'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the numeric route followed by another segment', () => {
      const value = 'https://my.mail.ru/video/embed/253943806846567285/extra'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the legacy route behind another segment', () => {
      const value = 'https://videoapi.my.mail.ru/x/videos/embed/mail/eduspb.com/_myvideo/248.html'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the legacy route followed by another segment', () => {
      const value =
        'https://videoapi.my.mail.ru/videos/embed/mail/eduspb.com/_myvideo/248.html/extra'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the path form behind another segment', () => {
      const value = 'https://my.mail.ru/x/mail/shels_1991/video/embed/20/885'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the path form followed by another segment', () => {
      const value = 'https://my.mail.ru/mail/shels_1991/video/embed/20/885/extra'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a legacy path that does not name a video', () => {
      const value = 'https://videoapi.my.mail.ru/videos/embed/mail/eduspb.com/list.html'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a swf on the image host that is not the player', () => {
      const value = 'http://img.mail.ru/r/banners/promo.swf?movieSrc=mail/anizm.com/4418/4427'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the Flash player path behind another segment', () => {
      const value = 'http://img.mail.ru/x/r/video2/uvpv3.swf?2&movieSrc=mail/anizm.com/4418/4427'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the Flash player path followed by another segment', () => {
      const value =
        'http://img.mail.ru/r/video2/uvpv3.swf/extra?2&movieSrc=mail/anizm.com/4418/4427'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the Flash player when nothing names a video', () => {
      const value = 'http://img.mail.ru/r/video2/uvpv3.swf?3'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed movieSrc as written, even if the player answers an error', () => {
      const value = 'http://img.mail.ru/r/video2/uvpv3.swf?2&movieSrc=mail/../../885&autoplay=0'
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'mail/../../885',
        src: 'https://my.mail.ru/mail/../video/embed/../885',
        url: 'https://my.mail.ru/mail/../video/../885.html',
        ratio: '16/9',
        author: '..',
      }

      expect(mailruResolveEmbed(value)).toEqual(expected)
    })

    it('should refuse a movieSrc behind a dot segment', () => {
      const value = 'http://img.mail.ru/r/video2/uvpv3.swf?2&movieSrc=../mail/anizm.com/4418/4427'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should refuse a movieSrc followed by a dot segment', () => {
      const value = 'http://img.mail.ru/r/video2/uvpv3.swf?2&movieSrc=mail/anizm.com/4418/4427/..'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should refuse a movieSrc carrying an extra segment after the type', () => {
      const value = 'http://img.mail.ru/r/video2/uvpv3.swf?2&movieSrc=mail/x/anizm.com/4418/4427'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should refuse a movieSrc carrying an extra segment in the album', () => {
      const value = 'http://img.mail.ru/r/video2/uvpv3.swf?2&movieSrc=mail/anizm.com/44/18/4427'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a par path that names no counter', () => {
      const value =
        'http://img.mail.ru/r/video2/player_v2.swf?par=http://content.video.mail.ru/mail/gsavinich/10/44'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a par path behind another segment', () => {
      const value =
        'http://img.mail.ru/r/video2/player_v2.swf?par=http://content.video.mail.ru/x/mail/gsavinich/10/$44$0$143'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a par path followed by another segment', () => {
      const value =
        'http://img.mail.ru/r/video2/player_v2.swf?par=http://content.video.mail.ru/mail/gsavinich/10/$44$0$143/extra'

      expect(mailruResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('mailruEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, mailruEmbedResolver)

  describe('happy paths', () => {
    it('should state the video ratio over the box the share dialog states', async () => {
      const value = html`
        <iframe
          src="https://my.mail.ru/video/embed/253943806846567285"
          width="626"
          height="367"
          frameborder="0"
          scrolling="no"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: '253943806846567285',
        src: 'https://my.mail.ru/video/embed/253943806846567285',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should repair the iframe on the dead api host', async () => {
      const value = html`
        <iframe
          src="http://api.video.mail.ru/videos/embed/corp/lady/86/753.html"
          width="540"
          height="328"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'corp/lady/86/753',
        src: 'https://my.mail.ru/corp/lady/video/embed/86/753',
        url: 'https://my.mail.ru/corp/lady/video/86/753.html',
        ratio: '16/9',
        author: 'lady',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/video/embed/253943806846567285"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the Flash player when its flashvars name no video', async () => {
      const value = html`
        <object
          type="application/x-shockwave-flash"
          data="http://img.mail.ru/r/video2/uvpv3.swf?3"
        >
          <param name="flashvars" value="autoplay=0" />
        </object>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the Flash player that named the video in its flashvars', () => {
    it('should repair the object whose flashvars param names the video', async () => {
      const value = html`
        <object
          type="application/x-shockwave-flash"
          data="http://img.mail.ru/r/video2/uvpv3.swf?3"
          width="626"
          height="367"
        >
          <param name="flashvars" value="movieSrc=mail/alinavrik59/142/143&autoplay=0" />
          <param name="allowFullScreen" value="true" />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'mail/alinavrik59/142/143',
        src: 'https://my.mail.ru/mail/alinavrik59/video/embed/142/143',
        url: 'https://my.mail.ru/mail/alinavrik59/video/142/143.html',
        ratio: '16/9',
        author: 'alinavrik59',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should repair the embed whose query names the video', async () => {
      const value = html`
        <embed
          src="http://img.mail.ru/r/video2/uvpv3.swf?2&movieSrc=mail/anizm.com/4418/4427&autoplay=0"
          width="100%"
          height="390"
          allowFullScreen="true"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'mail/anizm.com/4418/4427',
        src: 'https://my.mail.ru/mail/anizm.com/video/embed/4418/4427',
        url: 'https://my.mail.ru/mail/anizm.com/video/4418/4427.html',
        ratio: '16/9',
        author: 'anizm.com',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the older Flash player that named the video in its par path', () => {
    it('should repair the embed whose par path names the video', async () => {
      const value = html`
        <embed
          src="http://img.mail.ru/r/video2/player_v2.swf?par=http://content.video.mail.ru/mail/gsavinich/10/$44$0$143"
          type="application/x-shockwave-flash"
          width="380"
          height="325"
          flashvars="imaginehost=video.mail.ru&perlhost=video.mail.ru&alias=mail&username=gsavinich&albumid=10&id=44&catalogurl=http://video.mail.ru/themes/music"
          allowscriptaccess="always"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'mail/gsavinich/10/44',
        src: 'https://my.mail.ru/mail/gsavinich/video/embed/10/44',
        url: 'https://my.mail.ru/mail/gsavinich/video/10/44.html',
        ratio: '16/9',
        author: 'gsavinich',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should repair the object whose data names the video in its par path', async () => {
      const value = html`
        <object
          type="application/x-shockwave-flash"
          data="http://img.mail.ru/r/video2/player_v2.swf?par=http://content.video.mail.ru/bk/nutriti/nutriti_nepoznannoe/$1993$0$3441"
          height="367"
          width="585"
        >
          <param
            name="movie"
            value="http://img.mail.ru/r/video2/player_v2.swf?par=http://content.video.mail.ru/bk/nutriti/nutriti_nepoznannoe/$1993$0$3441"
          />
          <param
            name="flashvars"
            value="imaginehost=video.mail.ru&perlhost=video.mail.ru&alias=bk&username=nutriti&albumid=nutriti_nepoznannoe&id=1993&atalogurl=http://video.mail.ru/themes/misc&page=1"
          />
        </object>
      `
      const expected: EmbedResolverResult = {
        provider: 'mailru',
        id: 'bk/nutriti/nutriti_nepoznannoe/1993',
        src: 'https://my.mail.ru/bk/nutriti/video/embed/nutriti_nepoznannoe/1993',
        url: 'https://my.mail.ru/bk/nutriti/video/nutriti_nepoznannoe/1993.html',
        ratio: '16/9',
        author: 'nutriti',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('mailruEmbedResolver through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should turn the full size Flash player into a video placeholder', async () => {
    const value = html`
      <embed
        src="http://img.mail.ru/r/video/player_full_size.swf?par=http://video.mail.ru/mail/vi-talik/kazantip-2006/$262$0$348"
        type="application/x-shockwave-flash"
        width="452"
        height="385"
        flashvars="imaginehost=video.mail.ru&perlhost=my.video.mail.ru&alias=mail&username=vi-talik&albumid=kazantip-2006&id=262&catalogurl=http://video.mail.ru/catalog/tour/"
      >
    `
    const expected = html`
      <div
        data-embed-author="vi-talik"
        data-embed-ratio="16/9"
        data-embed-url="https://my.mail.ru/mail/vi-talik/video/kazantip-2006/262.html"
        data-embed-id="mail/vi-talik/kazantip-2006/262"
        data-embed-provider="mailru"
        data-embed-src="https://my.mail.ru/mail/vi-talik/video/embed/kazantip-2006/262"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})

describeForEachParser('mailruEmbedResolver carrier title', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, mailruEmbedResolver)

  it('should read the name the carrier states', async () => {
    const value = html`
      <iframe src="https://my.mail.ru/video/embed/253943806846567285" title="Прогулка по Невскому"></iframe>
    `
    const expected: EmbedResolverResult = {
      provider: 'mailru',
      id: '253943806846567285',
      src: 'https://my.mail.ru/video/embed/253943806846567285',
      ratio: '16/9',
      title: 'Прогулка по Невскому',
    }

    expect(await extract(value)).toEqual(expected)
  })
})
