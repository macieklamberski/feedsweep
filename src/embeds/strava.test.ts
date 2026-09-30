import { describe, expect, it } from 'bun:test'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  stravaIframeEmbedResolver,
  stravaPlaceholderEmbedResolver,
  stravaResolveEmbed,
} from './strava.js'

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
        ratio: '300/472',
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
        ratio: '300/531',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
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

    it('should ignore a kind that names an object property', async () => {
      const value = html`
        <div
          class="strava-embed-placeholder"
          data-embed-type="constructor"
          data-embed-id="1"
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

    it('should ignore an id that starts with digits and carries a path after them', async () => {
      const value = html`
        <div
          class="strava-embed-placeholder"
          data-embed-type="activity"
          data-embed-id="17975533403/../../route/1"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })

    // The bare attribute pair is also the placeholder feedsweep itself writes.
    it('should ignore a div without the Strava class', async () => {
      const value = html`
        <div
          data-embed-type="activity"
          data-embed-id="17975533403"
        ></div>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describe('stravaResolveEmbed', () => {
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
  describe('edge cases', () => {
    // A player route word on the wrong host or with a trailing segment still names a live
    // player's id, so it is repaired rather than refused.
    it('should repair a player route on the apex host with a trailing segment', () => {
      const value = 'https://www.strava.com/activity/2243948928/extra'
      const expected: EmbedResolverResult = {
        provider: 'strava',
        id: 'activity/2243948928',
        src: 'https://strava-embeds.com/activity/2243948928',
        url: 'https://www.strava.com/activities/2243948928',
        ratio: '300/472',
      }

      expect(stravaResolveEmbed(value)).toEqual(expected)
    })
  })
})

describeForEachParser('stravaIframeEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, stravaIframeEmbedResolver)

  describe('happy paths', () => {
    it('should resolve the activity player frame', async () => {
      const value = html`
        <iframe
          class="strava-embed-iframe"
          src="https://strava-embeds.com/activity/18764786676"
          width="600"
          height="730"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'strava',
        id: 'activity/18764786676',
        src: 'https://strava-embeds.com/activity/18764786676',
        url: 'https://www.strava.com/activities/18764786676',
        ratio: '300/472',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the route player frame onto the route page', async () => {
      const value = html`
        <iframe
          frameborder="0"
          style="width: 100%; min-width: 250px; max-width: 100%; height: 1px; display: block;"
          src="https://strava-embeds.com/route/3402113647713460798?fullWidth=true&amp;style=standard&amp;clubId=1495648&amp;fromEmbed=true#ns=c21c0aec-0a2d-4a1a-9482-fc9bc93fc379&amp;hostOrigin=https%3A%2F%2Fwww.nohobikeclub.org&amp;hostPath=%2Fnews%2F13541920%2FEditPost&amp;hostTitle=Northampton+Cycling+Club+-+Ride+Report+-+NCC+SMR+B+9%2F13%2F2025-+Northfield+Gulf&amp;mapHash=8.34/42.504/-72.523"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'strava',
        id: 'route/3402113647713460798',
        src: 'https://strava-embeds.com/route/3402113647713460798',
        url: 'https://www.strava.com/routes/3402113647713460798',
        ratio: '300/531',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should keep the access token in the src and leave the page unlinked', async () => {
      const value = html`
        <iframe
          frameborder="0"
          style="width: 554px; min-width: 250px; max-width: 100%; height: 595px; display: block;"
          src="https://strava-embeds.com/route/3498503191028593260?style=standard&amp;clubId=1495648&amp;fromEmbed=true&amp;token=Lk5027SO0Yu2iIF-TkH_hXz47g9Jr-mT7ANe6CTpqkA#ns=4adec2ed-0d75-4cbd-9819-cdc4fffd3395&amp;hostOrigin=https%3A%2F%2Fwww.nohobikeclub.org&amp;hostPath=%2Fnews%2F13640102%2FEditPost&amp;hostTitle=Northampton+Cycling+Club+-+Ride+Report%3A+SMR+06%2F06%2F2026&amp;mapHash=8.85/42.4478/-72.5277"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'strava',
        id: 'route/3498503191028593260',
        src: 'https://strava-embeds.com/route/3498503191028593260?token=Lk5027SO0Yu2iIF-TkH_hXz47g9Jr-mT7ANe6CTpqkA',
        ratio: '300/531',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the retired apex embed carrier onto the live player size', async () => {
      const value = html`
        <iframe
          height="405"
          width="590"
          frameborder="0"
          allowtransparency="true"
          scrolling="no"
          src="https://www.strava.com/activities/2243948928/embed/ca9c763ae38ff1185efd6519fe41dcfc4896619e"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'strava',
        id: 'activity/2243948928',
        src: 'https://strava-embeds.com/activity/2243948928',
        url: 'https://www.strava.com/activities/2243948928',
        ratio: '300/472',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should resolve the retired runs spelling of the apex embed as an activity', async () => {
      const value = html`
        <iframe
          height="405"
          width="590"
          frameborder="0"
          allowtransparency="true"
          scrolling="no"
          src="http://app.strava.com/runs/25546797/embed/c4f8dbaa8bd6757167ccef33043bc88b1e8edf6c"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'strava',
        id: 'activity/25546797',
        src: 'https://strava-embeds.com/activity/25546797',
        url: 'https://www.strava.com/activities/25546797',
        ratio: '300/472',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the path', async () => {
      const value = html`
        <iframe src="https://evil.test/activities/2243948928/embed/ca9c7"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a player frame of a kind outside the two the corpus carries', async () => {
      const value = html`
        <iframe src="https://strava-embeds.com/segment/229781"></iframe>
      `

      expect(await extract(value)).toBeUndefined()
    })
  })
})
