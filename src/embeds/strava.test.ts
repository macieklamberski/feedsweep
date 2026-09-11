import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  stravaIframeEmbedResolver,
  stravaPlaceholderEmbedResolver,
  stravaResolveEmbed,
} from './strava.js'

describe('stravaResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the player from the retired apex embed url', () => {
      const value =
        'https://www.strava.com/activities/2243948928/embed/ca9c763ae38ff1185efd6519fe41dcfc4896619e'
      const expected: EmbedResolverResult = {
        provider: 'strava',
        id: 'activity/2243948928',
        src: 'https://strava-embeds.com/activity/2243948928',
        url: 'https://www.strava.com/activities/2243948928',
        height: 650,
      }

      expect(stravaResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    // The athlete and club widgets answer on the apex and render as they stand, so they are
    // left to the generic placeholder.
    it('should ignore the athlete latest-rides widget', () => {
      const value = 'https://www.strava.com/athletes/6960345/latest-rides/100b02c4aa5c99ec4b7a1d1'

      expect(stravaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the club latest-rides widget', () => {
      const value = 'https://www.strava.com/clubs/33153/latest-rides/05a215fe38ff1185efd6519fe41'

      expect(stravaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an activity page that is not the embed route', () => {
      const value = 'https://www.strava.com/activities/2243948928'

      expect(stravaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore an activity id that is not digits', () => {
      const value = 'https://www.strava.com/activities/my-morning-ride/embed/ca9c763ae38ff1185ef'

      expect(stravaResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the site root', () => {
      const value = 'https://www.strava.com/'

      expect(stravaResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('stravaPlaceholderEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, stravaPlaceholderEmbedResolver)

  describe('happy paths', () => {
    it('should resolve an activity placeholder', async () => {
      const value = html`
        <div
          class="strava-embed-placeholder"
          data-embed-type="activity"
          data-embed-id="17975533403"
          data-style="standard"
          data-from-embed="false"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'strava',
        id: 'activity/17975533403',
        src: 'https://strava-embeds.com/activity/17975533403',
        url: 'https://www.strava.com/activities/17975533403',
        height: 650,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve a route placeholder onto the route page', async () => {
      const value = html`
        <div
          class="strava-embed-placeholder"
          data-embed-type="route"
          data-embed-id="3498503191028593260"
        ></div>
      `
      const expected: EmbedResolverResult = {
        provider: 'strava',
        id: 'route/3498503191028593260',
        src: 'https://strava-embeds.com/route/3498503191028593260',
        url: 'https://www.strava.com/routes/3498503191028593260',
        height: 650,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    // The kind is a path segment on the endpoint, so one the corpus has never carried is left
    // as the empty div it already is instead of minting a url nobody has seen answer.
    it('should ignore a kind outside the two the corpus carries', async () => {
      const value = html`
        <div
          class="strava-embed-placeholder"
          data-embed-type="segment"
          data-embed-id="229781"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore an id that is not digits', async () => {
      const value = html`
        <div
          class="strava-embed-placeholder"
          data-embed-type="activity"
          data-embed-id="../../route/1"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describeForEachParser('stravaIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, stravaIframeEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the retired apex embed carrier', async () => {
      const value = html`
        <iframe
          src="https://www.strava.com/activities/2243948928/embed/ca9c763ae38ff1185efd6519fe41dcfc"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'strava',
        id: 'activity/2243948928',
        src: 'https://strava-embeds.com/activity/2243948928',
        url: 'https://www.strava.com/activities/2243948928',
        height: 650,
      }

      expect(await extract(value)).toEqual(expected)
    })

    // The box the publisher declared was measured against a player that answers 404 today, so
    // the current player's own height stands instead of it.
    it('should keep its own height over the box the dead frame declared', async () => {
      const value = html`
        <iframe
          height="405"
          width="590"
          src="https://www.strava.com/activities/2243948928/embed/ca9c763ae38ff1185efd6519fe41dcfc"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'strava',
        id: 'activity/2243948928',
        src: 'https://strava-embeds.com/activity/2243948928',
        url: 'https://www.strava.com/activities/2243948928',
        height: 650,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the path', async () => {
      const value = html`
        <iframe src="https://evil.test/www.strava.com/activities/2243948928/embed/ca9c7"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
