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
        height: 548,
      }

      expect(garminResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should read the older spelling, port and all', () => {
      const value = 'http://connect.garmin.com:80/activity/embed/581167494'
      const expected: EmbedResolverResult = {
        provider: 'garmin',
        id: '581167494',
        src: 'https://connect.garmin.com/embed/activity/581167494',
        url: 'https://connect.garmin.com/app/activity/581167494',
        height: 548,
      }

      expect(garminResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should read the app spelling the chain passes through', () => {
      const value = 'https://connect.garmin.com/app/activity/embed/1393315994'
      const expected: EmbedResolverResult = {
        provider: 'garmin',
        id: '1393315994',
        src: 'https://connect.garmin.com/embed/activity/1393315994',
        url: 'https://connect.garmin.com/app/activity/1393315994',
        height: 548,
      }

      expect(garminResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should read the current spelling with its trailing slash', () => {
      const value = 'https://connect.garmin.com/embed/activity/1393315994/'
      const expected: EmbedResolverResult = {
        provider: 'garmin',
        id: '1393315994',
        src: 'https://connect.garmin.com/embed/activity/1393315994',
        url: 'https://connect.garmin.com/app/activity/1393315994',
        height: 548,
      }

      expect(garminResolveEmbed(new URL(value))).toEqual(expected)
    })
  })

  describe('courses', () => {
    it('should move a course on the modern spelling onto the route it redirects to', () => {
      const value = 'https://connect.garmin.com/modern/course/embed/291309601'
      const expected: EmbedResolverResult = {
        provider: 'garmin',
        id: 'course/291309601',
        src: 'https://connect.garmin.com/embed/course/291309601',
        url: 'https://connect.garmin.com/app/course/291309601',
        height: 548,
      }

      expect(garminResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should read a course on the current spelling', () => {
      const value = 'https://connect.garmin.com/embed/course/121074153'
      const expected: EmbedResolverResult = {
        provider: 'garmin',
        id: 'course/121074153',
        src: 'https://connect.garmin.com/embed/course/121074153',
        url: 'https://connect.garmin.com/app/course/121074153',
        height: 548,
      }

      expect(garminResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should read the kind in upper case and keep it as written', () => {
      const value = 'https://connect.garmin.com/modern/COURSE/embed/291309601'
      const expected: EmbedResolverResult = {
        provider: 'garmin',
        id: 'COURSE/291309601',
        src: 'https://connect.garmin.com/embed/COURSE/291309601',
        url: 'https://connect.garmin.com/app/COURSE/291309601',
        height: 548,
      }

      expect(garminResolveEmbed(new URL(value))).toEqual(expected)
    })

    it('should ignore a kind that is not an activity or a course', () => {
      const value = 'https://connect.garmin.com/modern/workout/embed/291309601'

      expect(garminResolveEmbed(new URL(value))).toBeUndefined()
    })
  })

  describe('sad paths', () => {
    it('should ignore the activity page, which is not the embed', () => {
      const value = 'https://connect.garmin.com/modern/activity/1393315994'

      expect(garminResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore the app spelling of that page as well', () => {
      const value = 'https://connect.garmin.com/app/activity/1393315994'

      expect(garminResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore the course page, which is not the embed', () => {
      const value = 'https://connect.garmin.com/course/1393315994'

      expect(garminResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore the embed route nested under another section', () => {
      const value = 'https://connect.garmin.com/course/embed/activity/1393315994'

      expect(garminResolveEmbed(new URL(value))).toBeUndefined()
    })

    it('should ignore a segment after the activity id', () => {
      const value = 'https://connect.garmin.com/modern/activity/embed/1393315994/extra'

      expect(garminResolveEmbed(new URL(value))).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a malformed activity id as written, even if the player answers an error', () => {
      const value = 'https://connect.garmin.com/embed/activity/latest'
      const expected: EmbedResolverResult = {
        provider: 'garmin',
        id: 'latest',
        src: 'https://connect.garmin.com/embed/activity/latest',
        url: 'https://connect.garmin.com/app/activity/latest',
        height: 548,
      }

      expect(garminResolveEmbed(new URL(value))).toEqual(expected)
    })
  })
})

describeForEachParser('garminEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, garminEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the course snippet', async () => {
      const value = html`
        <iframe
          src="https://connect.garmin.com/modern/course/embed/318418135"
          width="465"
          height="548"
          title="CourseEmbed"
          frameborder="0"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'garmin',
        id: 'course/318418135',
        src: 'https://connect.garmin.com/embed/course/318418135',
        url: 'https://connect.garmin.com/app/course/318418135',
        height: 548,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the platform size over the box the carrier declares', async () => {
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
        height: 548,
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

    it('should ignore a foreign host carrying the embed route', async () => {
      const value = '<iframe src="https://evil.test/embed/activity/1393315994"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})
