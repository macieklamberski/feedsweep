import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { yandexMusicEmbedResolver } from './yandexmusic.js'

describeForEachParser('yandexMusicEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, yandexMusicEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the album player at its share size', async () => {
      const value = html`
        <iframe
          frameborder="0"
          allow="clipboard-write"
          style="border:none;width:100%;height:556px;"
          width="100%"
          height="556"
          src="https://music.yandex.ru/iframe/album/42895752"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'album/42895752',
        src: 'https://music.yandex.ru/iframe/album/42895752',
        url: 'https://music.yandex.ru/album/42895752',
        height: 556,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a track in its album and key it on the track', async () => {
      const value = html`
        <iframe
          frameborder="0"
          allow="clipboard-write"
          style="border:none;width:614px;height:244px;"
          width="614"
          height="244"
          src="https://music.yandex.ru/iframe/album/6965469/track/152405368"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'track/152405368',
        src: 'https://music.yandex.ru/iframe/album/6965469/track/152405368',
        url: 'https://music.yandex.ru/album/6965469/track/152405368',
        height: 244,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the playlist player', async () => {
      const value = html`
        <iframe
          frameborder="0"
          allow="clipboard-write"
          style="border:none;width:100%;height:556px;"
          width="100%"
          height="556"
          src="https://music.yandex.ru/iframe/playlist/yandexmusic/1624"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'playlist/yandexmusic/1624',
        src: 'https://music.yandex.ru/iframe/playlist/yandexmusic/1624',
        url: 'https://music.yandex.ru/users/yandexmusic/playlists/1624',
        height: 556,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the track route that names its album second', async () => {
      const value = '<iframe src="https://music.yandex.ru/iframe/track/69287796/11578229"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'track/69287796',
        src: 'https://music.yandex.ru/iframe/album/11578229/track/69287796',
        url: 'https://music.yandex.ru/album/11578229/track/69287796',
        height: 244,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should pass a playlist owner through as written', async () => {
      const value =
        '<iframe src="https://music.yandex.ru/iframe/playlist/gigabyte-artur/1016"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'playlist/gigabyte-artur/1016',
        src: 'https://music.yandex.ru/iframe/playlist/gigabyte-artur/1016',
        url: 'https://music.yandex.ru/users/gigabyte-artur/playlists/1016',
        height: 556,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/iframe/album/42895752"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a page of the site that is not the player', async () => {
      const value = '<iframe src="https://music.yandex.ru/album/42895752"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player route under another first segment', async () => {
      const value = '<iframe src="https://music.yandex.ru/x/album/42895752"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route word the player does not serve', async () => {
      const value = '<iframe src="https://music.yandex.ru/iframe/station/42895752"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the bare player with no route', async () => {
      const value = '<iframe src="https://music.yandex.ru/iframe/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an album route with no album', async () => {
      const value = '<iframe src="https://music.yandex.ru/iframe/#album/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a track route with no track', async () => {
      const value = '<iframe src="https://music.yandex.ru/iframe/#track/"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a track route that names only the album', async () => {
      const value = '<iframe src="https://music.yandex.ru/iframe/#track/:221094"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a playlist route with no kind', async () => {
      const value = '<iframe src="https://music.yandex.ru/iframe/playlist/yandexmusic"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a hash album that is a dot segment', async () => {
      const value = '<iframe src="https://music.yandex.ru/iframe/#album/.."></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a hash playlist owner that is a dot segment', async () => {
      const value = '<iframe src="https://music.yandex.ru/iframe/#playlist/../1016"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a hash playlist kind that is a dot segment', async () => {
      const value =
        '<iframe src="https://music.yandex.ru/iframe/#playlist/yandexmusic/.."></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a hash track that is a dot segment', async () => {
      const value = '<iframe src="https://music.yandex.ru/iframe/#track/.."></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a track whose album after a colon is a dot segment', async () => {
      const value = '<iframe src="https://music.yandex.ru/iframe/track/1710816:.."></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should keep an album whose track segment names nothing', async () => {
      const value = '<iframe src="https://music.yandex.ru/iframe/#album/222130/track/"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'album/222130',
        src: 'https://music.yandex.ru/iframe/album/222130',
        url: 'https://music.yandex.ru/album/222130',
        height: 556,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the query the carrier writes', async () => {
      const value =
        '<iframe src="https://music.yandex.ru/iframe/album/42895752?theme=black&utm_source=feed"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'album/42895752',
        src: 'https://music.yandex.ru/iframe/album/42895752',
        url: 'https://music.yandex.ru/album/42895752',
        height: 556,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the path before the hash', async () => {
      const value =
        '<iframe src="https://music.yandex.ru/iframe/album/42895752#track/27037167/63123"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'album/42895752',
        src: 'https://music.yandex.ru/iframe/album/42895752',
        url: 'https://music.yandex.ru/album/42895752',
        height: 556,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the hash routes of the old share dialog', () => {
    it('should rebuild a hash track onto the album track path', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="100"
          src="https://music.yandex.ru/iframe/#track/27037167/63123/"
          style="border: none; height: 100px; width: 600px;"
          width="600"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'track/27037167',
        src: 'https://music.yandex.ru/iframe/album/63123/track/27037167',
        url: 'https://music.yandex.ru/album/63123/track/27037167',
        height: 244,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the colors after a hash album', async () => {
      const value = html`
        <iframe
          frameborder="0"
          style="border:none;width:740px;height:1000px;"
          width="740"
          height="1000"
          src="https://music.yandex.ru/iframe/#album/222130/white/F4F4F4/"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'album/222130',
        src: 'https://music.yandex.ru/iframe/album/222130',
        url: 'https://music.yandex.ru/album/222130',
        height: 556,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the album after a colon', async () => {
      const value = html`
        <iframe
          src="https://music.yandex.ru/iframe/#track/2223513:221094"
          frameborder="0"
          style="width:100%; height:120px; border:0px"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'track/2223513',
        src: 'https://music.yandex.ru/iframe/album/221094/track/2223513',
        url: 'https://music.yandex.ru/album/221094/track/2223513',
        height: 244,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a hash album track', async () => {
      const value =
        '<iframe src="https://music.yandex.ru/iframe/#album/63123/track/27037167"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'track/27037167',
        src: 'https://music.yandex.ru/iframe/album/63123/track/27037167',
        url: 'https://music.yandex.ru/album/63123/track/27037167',
        height: 244,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop the layout after a hash playlist', async () => {
      const value = html`
        <iframe
          src="https://music.yandex.ru/iframe/#playlist/uid-33vqrjsl/1000/show/cover/description/"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'playlist/uid-33vqrjsl/1000',
        src: 'https://music.yandex.ru/iframe/playlist/uid-33vqrjsl/1000',
        url: 'https://music.yandex.ru/users/uid-33vqrjsl/playlists/1000',
        height: 556,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the retired Flash track player', () => {
    it('should rebuild the Flash embed onto the track player', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          width="350"
          height="48"
          scale="noscale"
          flashvars="bg-color=%23F2F2F2&amp;text-color=%23777777&amp;hover-text-color=%23000000"
          src="http://music.yandex.ru/embed/18992685/track.swf"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'track/18992685',
        src: 'https://music.yandex.ru/iframe/track/18992685',
        url: 'https://music.yandex.ru/track/18992685',
        height: 244,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild a Flash embed on the Ukrainian host onto music.yandex.ru', async () => {
      const value = html`
        <embed
          type="application/x-shockwave-flash"
          width="350"
          height="48"
          scale="noscale"
          src="http://music.yandex.ua/embed/6098590/track.swf"
        >
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'track/6098590',
        src: 'https://music.yandex.ru/iframe/track/6098590',
        url: 'https://music.yandex.ru/track/6098590',
        height: 244,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should ignore a Flash file other than the track player', async () => {
      const value = '<embed src="http://music.yandex.ru/embed/18992685/album.swf">'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the Flash route with no track', async () => {
      const value = '<embed src="http://music.yandex.ru/embed/">'

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('the regional hosts', () => {
    it('should rebuild a player on music.yandex.by onto music.yandex.ru', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="100"
          src="https://music.yandex.by/iframe/#track/5978393/656696/hide/cover/black/"
          style="border: none; height: 70px; width: 600px;"
          width="600"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'track/5978393',
        src: 'https://music.yandex.ru/iframe/album/656696/track/5978393',
        url: 'https://music.yandex.ru/album/656696/track/5978393',
        height: 244,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild a player on music.yandex.com onto music.yandex.ru', async () => {
      const value = '<iframe src="https://music.yandex.com/iframe/album/39233612"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'yandexmusic',
        id: 'album/39233612',
        src: 'https://music.yandex.ru/iframe/album/39233612',
        url: 'https://music.yandex.ru/album/39233612',
        height: 556,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('yandex music shapes the pipeline repairs first', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should rebuild a Flash object onto one track player', async () => {
    const value = html`
      <object width="350" height="48">
        <param name="movie" value="http://music.yandex.ru/embed/18992685/track.swf">
        <embed
          type="application/x-shockwave-flash"
          width="350"
          height="48"
          src="http://music.yandex.ru/embed/18992685/track.swf"
        >
      </object>
    `
    const expected = html`
      <div
        data-embed-provider="yandexmusic"
        data-embed-id="track/18992685"
        data-embed-height="244"
        data-embed-url="https://music.yandex.ru/track/18992685"
        data-embed-src="https://music.yandex.ru/iframe/track/18992685"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
