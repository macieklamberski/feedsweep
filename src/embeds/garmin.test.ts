import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { garminEmbedResolver, garminResolveEmbed } from './garmin.js'

describe('garminResolveEmbed', () => {
  describe('happy paths', () => {
    it('should move the modern spelling onto the route it redirects to', () => {
      const value = 'https://connect.garmin.com/modern/activity/embed/1393315994'
      const expected: EmbedResolverResult = {
        provider: 'garmin',
        id: '1393315994',
        src: 'https://connect.garmin.com/embed/activity/1393315994',
        url: 'https://connect.garmin.com/app/activity/1393315994',
      }

      expect(garminResolveEmbed(value)).toEqual(expected)
    })

    it('should read the older spelling, port and all', () => {
      const value = 'http://connect.garmin.com:80/activity/embed/581167494'
      const expected: EmbedResolverResult = {
        provider: 'garmin',
        id: '581167494',
        src: 'https://connect.garmin.com/embed/activity/581167494',
        url: 'https://connect.garmin.com/app/activity/581167494',
      }

      expect(garminResolveEmbed(value)).toEqual(expected)
    })

    it('should read the app spelling the chain passes through', () => {
      const value = 'https://connect.garmin.com/app/activity/embed/1393315994'
      const expected: EmbedResolverResult = {
        provider: 'garmin',
        id: '1393315994',
        src: 'https://connect.garmin.com/embed/activity/1393315994',
        url: 'https://connect.garmin.com/app/activity/1393315994',
      }

      expect(garminResolveEmbed(value)).toEqual(expected)
    })

    it('should read the current spelling with its trailing slash', () => {
      const value = 'https://connect.garmin.com/embed/activity/1393315994/'
      const expected: EmbedResolverResult = {
        provider: 'garmin',
        id: '1393315994',
        src: 'https://connect.garmin.com/embed/activity/1393315994',
        url: 'https://connect.garmin.com/app/activity/1393315994',
      }

      expect(garminResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore the activity page, which is not the embed', () => {
      const value = 'https://connect.garmin.com/modern/activity/1393315994'

      expect(garminResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the app spelling of that page as well', () => {
      const value = 'https://connect.garmin.com/app/activity/1393315994'

      expect(garminResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a course, which names its own id space', () => {
      const value = 'https://connect.garmin.com/course/1393315994'

      expect(garminResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an activity id that is not a number', () => {
      const value = 'https://connect.garmin.com/embed/activity/latest'

      expect(garminResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('garminEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, garminEmbedResolver)

  describe('happy paths', () => {
    it('should keep the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://connect.garmin.com/modern/activity/embed/1393315994"
          width="465"
          height="500"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'garmin',
        id: '1393315994',
        src: 'https://connect.garmin.com/embed/activity/1393315994',
        url: 'https://connect.garmin.com/app/activity/1393315994',
        width: 465,
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a lookalike host', async () => {
      const value =
        '<iframe src="https://connect.garmin.com.evil.test/embed/activity/1393315994"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host naming the embed route in its path', async () => {
      const value =
        '<iframe src="https://evil.test/connect.garmin.com/embed/activity/1393315994"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
