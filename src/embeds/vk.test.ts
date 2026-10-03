import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  isVkReady,
  readVkHeight,
  vkEmbedResolver,
  vkRenderHint,
  vkResolveEmbed,
  vkWidgetEmbedResolver,
} from './vk.js'

describe('vkResolveEmbed', () => {
  describe('happy paths', () => {
    it('should carry the owner and the video as one id', () => {
      const value = 'https://vkvideo.ru/video_ext.php?oid=-214899652&id=456246970&hd=1'
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '-214899652_456246970',
        src: 'https://vk.ru/video_ext.php?oid=-214899652&id=456246970',
        url: 'https://vkvideo.ru/video-214899652_456246970',
        ratio: '16/9',
      }

      expect(vkResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the hash in the player alone and drop the rest', () => {
      const value =
        'https://vkvideo.ru/video_ext.php?oid=-53159866&id=456240593&hash=622100e5918230de&hd=2'
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '-53159866_456240593',
        src: 'https://vk.ru/video_ext.php?oid=-53159866&id=456240593&hash=622100e5918230de',
        url: 'https://vkvideo.ru/video-53159866_456240593',
        ratio: '16/9',
      }

      expect(vkResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the video_embed route onto the player', () => {
      const value = 'https://vk.com/video_embed?oid=-206078025&id=456239342'
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '-206078025_456239342',
        src: 'https://vk.ru/video_ext.php?oid=-206078025&id=456239342',
        url: 'https://vkvideo.ru/video-206078025_456239342',
        ratio: '16/9',
      }

      expect(vkResolveEmbed(value)).toEqual(expected)
    })

    it('should open a clip on the clip page', () => {
      const value = 'https://vk.com/clip_ext.php?oid=-29605110&id=456249286'
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '-29605110_456249286',
        src: 'https://vk.ru/clip_ext.php?oid=-29605110&id=456249286',
        url: 'https://vkvideo.ru/clip-29605110_456249286',
        ratio: '16/9',
      }

      expect(vkResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a path that is not a player', () => {
      const value = 'https://vk.com/al_video.php?oid=1&id=2'

      expect(vkResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the video page itself', () => {
      const value = 'https://vk.com/video-1_2'

      expect(vkResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player naming no video', () => {
      const value = 'https://vk.com/video_ext.php?oid=-1'

      expect(vkResolveEmbed(value)).toBeUndefined()
    })

    it('should use a malformed owner id as written, even if the player answers an error', () => {
      const value = 'https://vk.com/video_ext.php?oid=../1&id=2'
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '../1_2',
        src: 'https://vk.ru/video_ext.php?oid=..%2F1&id=2',
        url: 'https://vkvideo.ru/video..%2F1_2',
        ratio: '16/9',
      }

      expect(vkResolveEmbed(value)).toEqual(expected)
    })

    it('should use a malformed video id as written, even if the player answers an error', () => {
      const value = 'https://vk.com/video_ext.php?oid=-1&id=../2'
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '-1_../2',
        src: 'https://vk.ru/video_ext.php?oid=-1&id=..%2F2',
        url: 'https://vkvideo.ru/video-1_..%2F2',
        ratio: '16/9',
      }

      expect(vkResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('vkEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, vkEmbedResolver)

  describe('happy paths', () => {
    it('should mint the player on the vkvideo.ru host onto vk.ru', async () => {
      const value = html`
        <iframe
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowfullscreen="1"
          frameborder="0"
          height="360"
          src="https://vkvideo.ru/video_ext.php?oid=123281235&amp;id=456239021&amp;hash=723fea439e88f0ae"
          width="640"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '123281235_456239021',
        src: 'https://vk.ru/video_ext.php?oid=123281235&id=456239021&hash=723fea439e88f0ae',
        url: 'https://vkvideo.ru/video123281235_456239021',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the player on the vk.com host onto vk.ru', async () => {
      const value = html`
        <iframe
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowfullscreen="1"
          frameborder="0"
          height="360"
          src="https://vk.com/video_ext.php?oid=444168992&id=456241377&hash=fff86ef53c5f9a77"
          width="640"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '444168992_456241377',
        src: 'https://vk.ru/video_ext.php?oid=444168992&id=456241377&hash=fff86ef53c5f9a77',
        url: 'https://vkvideo.ru/video444168992_456241377',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the player on the vk.ru host', async () => {
      const value = html`
        <iframe
          src="https://vk.ru/video_ext.php?oid=-65529261&id=456240001"
          width="640"
          height="360"
          frameborder="0"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '-65529261_456240001',
        src: 'https://vk.ru/video_ext.php?oid=-65529261&id=456240001',
        url: 'https://vkvideo.ru/video-65529261_456240001',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the player on the vkontakte.ru host onto vk.ru', async () => {
      const value = html`
        <iframe
          src="http://vkontakte.ru/video_ext.php?oid=25582471&id=136966218&hash=482381d766b9995d"
          width="607"
          height="360"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '25582471_136966218',
        src: 'https://vk.ru/video_ext.php?oid=25582471&id=136966218&hash=482381d766b9995d',
        url: 'https://vkvideo.ru/video25582471_136966218',
        ratio: '16/9',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host serving the player path', async () => {
      const value = '<iframe src="https://evil.test/video_ext.php?oid=-1&id=2"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('vkWidgetEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, vkWidgetEmbedResolver)

  describe('happy paths', () => {
    it('should mint the post widget from the call beside the div', async () => {
      const value = html`
        <div id="vk_post_-211296925_60"></div>
        <script
          type="text/javascript"
          src="https://vk.com/js/api/openapi.js?169"
        ></script>
        <script type="text/javascript">
          (function() {
            VK.Widgets.Post("vk_post_-211296925_60", -211296925, 60, 'bVYhst3km4JT6iZGIjNrIdnZCDT1', {width: 1200});
          }());
        </script>
      `
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: 'wall-211296925_60',
        src: 'https://vk.ru/widget_post.php?owner_id=-211296925&post_id=60&hash=bVYhst3km4JT6iZGIjNrIdnZCDT1',
        url: 'https://vk.ru/wall-211296925_60',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the call from a paragraph after the div', async () => {
      const value = html`
        <div id="vk_post_-62353676_2228"></div>
        <p>
          <script
            type="text/javascript"
            src="https://vk.com/js/api/openapi.js?173"
          ></script><br />
          <script type="text/javascript">
            (function() {
              VK.Widgets.Post("vk_post_-62353676_2228", -62353676, 2228, 'pcjw5YUMJw1VBtdRfSPxm8qBgrs');
            }());
          </script>
        </p>
      `
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: 'wall-62353676_2228',
        src: 'https://vk.ru/widget_post.php?owner_id=-62353676&post_id=2228&hash=pcjw5YUMJw1VBtdRfSPxm8qBgrs',
        url: 'https://vk.ru/wall-62353676_2228',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a hash in double quotes', async () => {
      const value = html`
        <div id="vk_post_-227282754_915"></div>
        <script type="text/javascript">
          VK.Widgets.Post("vk_post_-227282754_915", -227282754, 915, "FFNod1QikYf6iVgRAOsZqnZkD6I");
        </script>
      `
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: 'wall-227282754_915',
        src: 'https://vk.ru/widget_post.php?owner_id=-227282754&post_id=915&hash=FFNod1QikYf6iVgRAOsZqnZkD6I',
        url: 'https://vk.ru/wall-227282754_915',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should mint the playlist widget with no page url', async () => {
      const value = html`
        <div id='vk_playlist_-113047006_85410764'></div>
        <p><script type="text/javascript">   VK.Widgets.Playlist('vk_playlist_-113047006_85410764', -113047006, 85410764, 'c2c936956e79205795');</script></p>
      `
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: 'audio_playlist-113047006_85410764',
        src: 'https://vk.ru/widget_playlist.php?oid=-113047006&pid=85410764&hash=c2c936956e79205795',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should pick the call naming this div out of a script filling several', async () => {
      const value = html`
        <div id="vk_post_-29531123_1341">&nbsp;</div>
        <script type="text/javascript">
          (function() {
            if (!window.VK || !VK.Widgets || !VK.Widgets.Post || !VK.Widgets.Post('vk_post_-29531123_1340', -29531123, 1340, 'pS9tEkS7Ul0yJMdgUf8kQJ3Iel8')) setTimeout(arguments.callee, 50);
            if (!window.VK || !VK.Widgets || !VK.Widgets.Post || !VK.Widgets.Post('vk_post_-29531123_1341', -29531123, 1341, 'Rk0ZsLX3e8kWlJbfKt2v1HW9h0E')) setTimeout(arguments.callee, 50);
          }());
        </script>
      `
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: 'wall-29531123_1341',
        src: 'https://vk.ru/widget_post.php?owner_id=-29531123&post_id=1341&hash=Rk0ZsLX3e8kWlJbfKt2v1HW9h0E',
        url: 'https://vk.ru/wall-29531123_1341',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a div whose call the feed dropped', async () => {
      const value = html`
        <div id="vk_post_-56385211_5564">
          <p>Мы приглашаем всех желающих к сотрудничеству.</p>
        </div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a call naming another div', async () => {
      const value = html`
        <div id="vk_post_-62353676_222"></div>
        <script type="text/javascript">
          VK.Widgets.Post("vk_post_-62353676_2228", -62353676, 2228, 'pcjw5YUMJw1VBtdRfSPxm8qBgrs');
        </script>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a call to another widget', async () => {
      const value = html`
        <div id="vk_post_-62353676_2228"></div>
        <script type="text/javascript">
          VK.Widgets.Comments("vk_post_-62353676_2228", -62353676, 2228, 'pcjw5YUMJw1VBtdRfSPxm8qBgrs');
        </script>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should pass an owner id through as written', async () => {
      const value = html`
        <div id="vk_post_-62353676_2228"></div>
        <script type="text/javascript">
          VK.Widgets.Post("vk_post_-62353676_2228", owner, 2228, 'pcjw5YUMJw1VBtdRfSPxm8qBgrs');
        </script>
      `
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: 'wallowner_2228',
        src: 'https://vk.ru/widget_post.php?owner_id=owner&post_id=2228&hash=pcjw5YUMJw1VBtdRfSPxm8qBgrs',
        url: 'https://vk.ru/wallowner_2228',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should pass an empty hash through as written', async () => {
      const value = html`
        <div id="vk_playlist_-224301543_164"></div>
        <script type="text/javascript">
          VK.Widgets.Playlist("vk_playlist_-224301543_164", -224301543, 164, "", {});
        </script>
      `
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: 'audio_playlist-224301543_164',
        src: 'https://vk.ru/widget_playlist.php?oid=-224301543&pid=164&hash=',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describe('isVkReady', () => {
  it('should accept the message the player posts once it has loaded', () => {
    const value = {
      videoId: '444168992_456241378',
      state: 'unstarted',
      volume: 1,
      muted: false,
      time: 0,
      duration: 2289,
      quality: 0,
      event: 'inited',
    }

    expect(isVkReady(value)).toBe(true)
  })

  it('should refuse another state message', () => {
    const value = {
      state: 'unstarted',
      volume: 1,
      muted: false,
      time: 0,
      duration: 2289,
      quality: 240,
      event: 'qualitychange',
    }

    expect(isVkReady(value)).toBe(false)
  })

  it('should refuse the event name posted as a string', () => {
    expect(isVkReady('inited')).toBe(false)
  })
})

describe('readVkHeight', () => {
  it('should read the height the widget frame posts', () => {
    const value = 'feeds:["resize",[314.03125]]'

    expect(readVkHeight(value)).toBe(314.03125)
  })

  it('should refuse the message that opens the channel', () => {
    expect(readVkHeight('feeds:["%init%"]')).toBeUndefined()
  })

  it('should refuse a message keyed for another frame', () => {
    expect(readVkHeight('ab123:["resize",[314.03125]]')).toBeUndefined()
  })

  it('should refuse a message that is not JSON after the key', () => {
    expect(readVkHeight('feeds:resize')).toBeUndefined()
  })

  it('should refuse a message posted as an object', () => {
    expect(readVkHeight({ height: 314 })).toBeUndefined()
  })

  it('should refuse a resize with no height', () => {
    expect(readVkHeight('feeds:["resize"]')).toBeUndefined()
  })

  it('should name the frame with the key the message carries', () => {
    expect(vkRenderHint.frameName).toBe('fXDfeeds')
  })
})

describeForEachParser('vk widgets through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace the div with the post widget and drop the loader and the call', async () => {
    const value = html`
      <p>Летний лагерь</p>
      <div id="vk_post_-211296925_60"></div>
      <script
        type="text/javascript"
        src="https://vk.com/js/api/openapi.js?169"
      ></script>
      <script type="text/javascript">
        (function() {
          VK.Widgets.Post("vk_post_-211296925_60", -211296925, 60, 'bVYhst3km4JT6iZGIjNrIdnZCDT1', {width: 1200});
        }());
      </script>
    `
    const expected = html`
      <p>Летний лагерь</p>
      <div
        data-embed-url="https://vk.ru/wall-211296925_60"
        data-embed-id="wall-211296925_60"
        data-embed-provider="vk"
        data-embed-src="https://vk.ru/widget_post.php?owner_id=-211296925&post_id=60&hash=bVYhst3km4JT6iZGIjNrIdnZCDT1"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should resolve every div of a script that fills several', async () => {
    const value = html`
      <div id="vk_post_-29531123_1340">&nbsp;</div>
      <div id="vk_post_-29531123_1341">&nbsp;</div>
      <script type="text/javascript">
        VK.Widgets.Post('vk_post_-29531123_1340', -29531123, 1340, 'pS9tEkS7Ul0yJMdgUf8kQJ3Iel8');
        VK.Widgets.Post('vk_post_-29531123_1341', -29531123, 1341, 'Rk0ZsLX3e8kWlJbfKt2v1HW9h0E');
      </script>
    `
    const expected = [
      'https://vk.ru/widget_post.php?owner_id=-29531123&post_id=1340&hash=pS9tEkS7Ul0yJMdgUf8kQJ3Iel8',
      'https://vk.ru/widget_post.php?owner_id=-29531123&post_id=1341&hash=Rk0ZsLX3e8kWlJbfKt2v1HW9h0E',
    ]
    const placeholders = parseHtml(await convert(value)).querySelectorAll('[data-embed-src]')
    const sources = [...placeholders].map((element) => element.getAttribute('data-embed-src'))

    expect(sources).toEqual(expected)
  })
})
