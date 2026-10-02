import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import {
  acuityschedulingEmbedResolver,
  acuityschedulingResolveEmbed,
  readAcuityschedulingHeight,
} from './acuityscheduling.js'

describe('acuityschedulingResolveEmbed', () => {
  describe('happy paths', () => {
    it('should build the scheduler from the owner', () => {
      const value = 'https://app.acuityscheduling.com/schedule.php?owner=14276092'
      const expected: EmbedResolverResult = {
        provider: 'acuityscheduling',
        id: '14276092',
        src: 'https://app.acuityscheduling.com/schedule.php?owner=14276092',
        url: 'https://app.acuityscheduling.com/schedule.php?owner=14276092',
      }

      expect(acuityschedulingResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the appointment type and put it in the key', () => {
      const value =
        'https://app.acuityscheduling.com/schedule.php?owner=19828685&appointmentType=28566466'
      const expected: EmbedResolverResult = {
        provider: 'acuityscheduling',
        id: '19828685/28566466',
        src: 'https://app.acuityscheduling.com/schedule.php?owner=19828685&appointmentType=28566466',
        url: 'https://app.acuityscheduling.com/schedule.php?owner=19828685&appointmentType=28566466',
      }

      expect(acuityschedulingResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the owner once where the embed code repeats it', () => {
      const value =
        'https://app.acuityscheduling.com/schedule.php?owner=12572531&owner=12572531&appointmentType=1914136'
      const expected: EmbedResolverResult = {
        provider: 'acuityscheduling',
        id: '12572531/1914136',
        src: 'https://app.acuityscheduling.com/schedule.php?owner=12572531&appointmentType=1914136',
        url: 'https://app.acuityscheduling.com/schedule.php?owner=12572531&appointmentType=1914136',
      }

      expect(acuityschedulingResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a category of appointment types as written', () => {
      const value =
        'https://app.acuityscheduling.com/schedule.php?owner=13689466&appointmentType=category:Campfire%20Mini%20Sessions'
      const expected: EmbedResolverResult = {
        provider: 'acuityscheduling',
        id: '13689466/category:Campfire Mini Sessions',
        src: 'https://app.acuityscheduling.com/schedule.php?owner=13689466&appointmentType=category%3ACampfire+Mini+Sessions',
        url: 'https://app.acuityscheduling.com/schedule.php?owner=13689466&appointmentType=category%3ACampfire+Mini+Sessions',
      }

      expect(acuityschedulingResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the calendar', () => {
      const value = 'https://app.acuityscheduling.com/schedule.php?owner=12493437&calendarID=651411'
      const expected: EmbedResolverResult = {
        provider: 'acuityscheduling',
        id: '12493437',
        src: 'https://app.acuityscheduling.com/schedule.php?owner=12493437&calendarID=651411',
        url: 'https://app.acuityscheduling.com/schedule.php?owner=12493437&calendarID=651411',
      }

      expect(acuityschedulingResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the location', () => {
      const value = 'https://app.acuityscheduling.com/schedule.php?owner=12493437&location=Studio'
      const expected: EmbedResolverResult = {
        provider: 'acuityscheduling',
        id: '12493437',
        src: 'https://app.acuityscheduling.com/schedule.php?owner=12493437&location=Studio',
        url: 'https://app.acuityscheduling.com/schedule.php?owner=12493437&location=Studio',
      }

      expect(acuityschedulingResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the referral source and tracking', () => {
      const value =
        'https://app.acuityscheduling.com/schedule.php?owner=13184170&appointmentType=54171635&source=website&ref=embedded_csp&utm_source=post'
      const expected: EmbedResolverResult = {
        provider: 'acuityscheduling',
        id: '13184170/54171635',
        src: 'https://app.acuityscheduling.com/schedule.php?owner=13184170&appointmentType=54171635',
        url: 'https://app.acuityscheduling.com/schedule.php?owner=13184170&appointmentType=54171635',
      }

      expect(acuityschedulingResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a scheduler with no owner', () => {
      const value = 'https://app.acuityscheduling.com/schedule.php?appointmentType=28566466'

      expect(acuityschedulingResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore another route on the host', () => {
      const value = 'https://app.acuityscheduling.com/catalog.php?owner=14276092'

      expect(acuityschedulingResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the button script, which opens the scheduler in an overlay', () => {
      const value = 'https://embed.acuityscheduling.com/embed/button/19367985.js'

      expect(acuityschedulingResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the scheduler path on another subdomain', () => {
      const value = 'https://embed.acuityscheduling.com/schedule.php?owner=14276092'

      expect(acuityschedulingResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('acuityschedulingEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, acuityschedulingEmbedResolver)

  describe('happy paths', () => {
    it('should build the scheduler from the embed code iframe', async () => {
      const value = html`
        <iframe
          frameBorder="0"
          src="https://app.acuityscheduling.com/schedule.php?owner=12572531&amp;owner=12572531&amp;appointmentType=1914136"
          width="100%"
          height="800"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'acuityscheduling',
        id: '12572531/1914136',
        src: 'https://app.acuityscheduling.com/schedule.php?owner=12572531&appointmentType=1914136',
        url: 'https://app.acuityscheduling.com/schedule.php?owner=12572531&appointmentType=1914136',
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value = '<iframe src="https://evil.test/schedule.php?owner=14276092"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

describe('readAcuityschedulingHeight', () => {
  it('should read the height out of the sizing message', () => {
    const value = 'sizing:1055'

    expect(readAcuityschedulingHeight(value)).toBe(1055)
  })

  it('should ignore a zero height', () => {
    const value = 'sizing:0'

    expect(readAcuityschedulingHeight(value)).toBeUndefined()
  })

  it('should ignore a message with text before the prefix', () => {
    const value = 'resizing:1055'

    expect(readAcuityschedulingHeight(value)).toBeUndefined()
  })

  it('should ignore a message with text after the height', () => {
    const value = 'sizing:1055px'

    expect(readAcuityschedulingHeight(value)).toBeUndefined()
  })

  it('should ignore a message that is not a string', () => {
    const value = { height: 1055 }

    expect(readAcuityschedulingHeight(value)).toBeUndefined()
  })
})

describeForEachParser('acuityscheduling through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
    })
  }

  it('should turn the embed code iframe into a scheduler placeholder', async () => {
    const value = html`
      <iframe
        frameBorder="0"
        src="https://app.acuityscheduling.com/schedule.php?owner=12572531&amp;owner=12572531&amp;appointmentType=1914136"
        width="100%"
        height="800"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-url="https://app.acuityscheduling.com/schedule.php?owner=12572531&amp;appointmentType=1914136"
        data-embed-id="12572531/1914136"
        data-embed-provider="acuityscheduling"
        data-embed-src="https://app.acuityscheduling.com/schedule.php?owner=12572531&amp;appointmentType=1914136"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
