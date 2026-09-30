import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { vkEmbedResolver, vkResolveEmbed } from './vk.js'

describe('vkResolveEmbed', () => {
  describe('happy paths', () => {
    it('should carry the owner and the video as one id', () => {
      const value = 'https://vkvideo.ru/video_ext.php?oid=-214899652&id=456246970&hd=1'
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '-214899652_456246970',
        src: 'https://vkvideo.ru/video_ext.php?oid=-214899652&id=456246970&hd=1',
        url: 'https://vkvideo.ru/video-214899652_456246970',
      }

      expect(vkResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the hash and the rest of the player query as written', () => {
      const value =
        'https://vkvideo.ru/video_ext.php?oid=-53159866&id=456240593&hash=622100e5918230de&hd=2'
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '-53159866_456240593',
        src: 'https://vkvideo.ru/video_ext.php?oid=-53159866&id=456240593&hash=622100e5918230de&hd=2',
        url: 'https://vkvideo.ru/video-53159866_456240593',
      }

      expect(vkResolveEmbed(value)).toEqual(expected)
    })

    it('should mint the video_embed route onto the player', () => {
      const value = 'https://vk.com/video_embed?oid=-206078025&id=456239342'
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '-206078025_456239342',
        src: 'https://vk.com/video_ext.php?oid=-206078025&id=456239342',
        url: 'https://vkvideo.ru/video-206078025_456239342',
      }

      expect(vkResolveEmbed(value)).toEqual(expected)
    })

    it('should open a clip on the clip page', () => {
      const value = 'https://vk.com/clip_ext.php?oid=-1&id=2'
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '-1_2',
        src: 'https://vk.com/clip_ext.php?oid=-1&id=2',
        url: 'https://vkvideo.ru/clip-1_2',
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

    it('should ignore an owner id with a prefix outside its alphabet', () => {
      const value = 'https://vk.com/video_ext.php?oid=../1&id=2'

      expect(vkResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an owner id with a suffix outside its alphabet', () => {
      const value = 'https://vk.com/video_ext.php?oid=1/../x&id=2'

      expect(vkResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a video id with a prefix outside its alphabet', () => {
      const value = 'https://vk.com/video_ext.php?oid=-1&id=../2'

      expect(vkResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a video id with a suffix outside its alphabet', () => {
      const value = 'https://vk.com/video_ext.php?oid=-1&id=2/../x'

      expect(vkResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('vkEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, vkEmbedResolver)

  describe('happy paths', () => {
    it('should read the player on the vkvideo.ru host', async () => {
      const value = html`
        <iframe
          src="https://vkvideo.ru/video_ext.php?oid=-214899652&id=456246970&hd=1"
          width="640"
          height="360"
          allowfullscreen
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '-214899652_456246970',
        src: 'https://vkvideo.ru/video_ext.php?oid=-214899652&id=456246970&hd=1',
        url: 'https://vkvideo.ru/video-214899652_456246970',
        width: 640,
        height: 360,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the player on the vk.com host', async () => {
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
        src: 'https://vk.com/video_ext.php?oid=444168992&id=456241377&hash=fff86ef53c5f9a77',
        url: 'https://vkvideo.ru/video444168992_456241377',
        width: 640,
        height: 360,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the player on the vk.ru host', async () => {
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
        width: 640,
        height: 360,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read the player on the vkontakte.ru host', async () => {
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
        src: 'http://vkontakte.ru/video_ext.php?oid=25582471&id=136966218&hash=482381d766b9995d',
        url: 'https://vkvideo.ru/video25582471_136966218',
        width: 607,
        height: 360,
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
