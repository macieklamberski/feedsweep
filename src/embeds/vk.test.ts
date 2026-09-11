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
        url: 'https://vk.com/video-214899652_456246970',
      }

      expect(vkResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the hash that unlocks a private video and drop the rest', () => {
      const value = 'https://vk.com/video_ext.php?oid=123&id=456&hash=abc123&autoplay=1'
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '123_456',
        src: 'https://vk.com/video_ext.php?oid=123&id=456&hash=abc123',
        url: 'https://vk.com/video123_456',
      }

      expect(vkResolveEmbed(value)).toEqual(expected)
    })

    it('should open a clip on the clip page', () => {
      const value = 'https://vk.com/clip_ext.php?oid=-1&id=2'
      const expected: EmbedResolverResult = {
        provider: 'vk',
        id: '-1_2',
        src: 'https://vk.com/clip_ext.php?oid=-1&id=2',
        url: 'https://vk.com/clip-1_2',
      }

      expect(vkResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the video page itself', () => {
      const value = 'https://vk.com/video-1_2'

      expect(vkResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a player naming no video', () => {
      const value = 'https://vk.com/video_ext.php?oid=-1'

      expect(vkResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an owner id outside its alphabet', () => {
      const value = 'https://vk.com/video_ext.php?oid=../x&id=2'

      expect(vkResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('vkEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, vkEmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the player declares', async () => {
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
        url: 'https://vk.com/video-214899652_456246970',
        width: 640,
        height: 360,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host naming the player in its path', async () => {
      const value = '<iframe src="https://evil.test/vk.com/video_ext.php?oid=-1&id=2"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
