import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { googlesheetsEmbedResolver, googlesheetsResolveEmbed } from './googlesheets.js'

describe('googlesheetsResolveEmbed', () => {
  describe('happy paths', () => {
    it('should keep the tab bar and header flags of a published sheet', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x/pubhtml?widget=true&headers=false'
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x',
        src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x/pubhtml?widget=true&headers=false',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x/pubhtml',
        height: 500,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the tab a sheet framed by its file id opens on', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/10P1pvE-X8KqXW58mnhb42Ve2aQoBv8mBFYeQkzvZndM/pubhtml?gid=1511085359&single=true&widget=true&headers=false'
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '10P1pvE-X8KqXW58mnhb42Ve2aQoBv8mBFYeQkzvZndM',
        src: 'https://docs.google.com/spreadsheets/d/10P1pvE-X8KqXW58mnhb42Ve2aQoBv8mBFYeQkzvZndM/pubhtml?gid=1511085359&single=true&widget=true&headers=false',
        url: 'https://docs.google.com/spreadsheets/d/10P1pvE-X8KqXW58mnhb42Ve2aQoBv8mBFYeQkzvZndM/pubhtml',
        height: 500,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the cell range and the title bar flag of a sheet', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/1XCf_FhT4FFMeO2FRJUQiuvT9CYu7i3dOt3FNNer9WMc/pubhtml?gid=1096163043&single=true&widget=false&headers=false&chrome=false&range=A1:G18'
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '1XCf_FhT4FFMeO2FRJUQiuvT9CYu7i3dOt3FNNer9WMc',
        src: 'https://docs.google.com/spreadsheets/d/1XCf_FhT4FFMeO2FRJUQiuvT9CYu7i3dOt3FNNer9WMc/pubhtml?gid=1096163043&single=true&widget=false&headers=false&chrome=false&range=A1:G18',
        url: 'https://docs.google.com/spreadsheets/d/1XCf_FhT4FFMeO2FRJUQiuvT9CYu7i3dOt3FNNer9WMc/pubhtml',
        height: 500,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the minimal toolbar flag, which draws the same sheet', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwT6OXaYOLfiKZtE1Ki7VMLKkxHFKVZBtbG7VbQ_Fh7irnAHTMxGtQ45jEcNdZA6he8v7Wcx52Ac5m/pubhtml?widget=true&headers=false&rm=minimal'
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '2PACX-1vTwT6OXaYOLfiKZtE1Ki7VMLKkxHFKVZBtbG7VbQ_Fh7irnAHTMxGtQ45jEcNdZA6he8v7Wcx52Ac5m',
        src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwT6OXaYOLfiKZtE1Ki7VMLKkxHFKVZBtbG7VbQ_Fh7irnAHTMxGtQ45jEcNdZA6he8v7Wcx52Ac5m/pubhtml?widget=true&headers=false',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwT6OXaYOLfiKZtE1Ki7VMLKkxHFKVZBtbG7VbQ_Fh7irnAHTMxGtQ45jEcNdZA6he8v7Wcx52Ac5m/pubhtml',
        height: 500,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the share tracker of a sheet', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x/pubhtml?widget=true&usp=sharing'
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x',
        src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x/pubhtml?widget=true',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x/pubhtml',
        height: 500,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the output flag, which draws the same sheet', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/1gK8t8PedCgoRnLjulWMkJHIU7lecnmmhNcyVgVoZHYQ/pubhtml?gid=0&single=true&output=html&chrome=false&headers=false&widget=false'
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '1gK8t8PedCgoRnLjulWMkJHIU7lecnmmhNcyVgVoZHYQ',
        src: 'https://docs.google.com/spreadsheets/d/1gK8t8PedCgoRnLjulWMkJHIU7lecnmmhNcyVgVoZHYQ/pubhtml?gid=0&single=true&chrome=false&headers=false&widget=false',
        url: 'https://docs.google.com/spreadsheets/d/1gK8t8PedCgoRnLjulWMkJHIU7lecnmmhNcyVgVoZHYQ/pubhtml',
        height: 500,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })

    it('should drop the embedded flag, which draws the same sheet', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vR1wLa6JQpFtYSYWqQ-KnXzdY7ZSBGrVJRdkplyQD5_ts18GF3qqnlRobuuBIb0MpFSDGWHCI8onOoS/pubhtml?embedded=true,single=true&widget=true&'
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '2PACX-1vR1wLa6JQpFtYSYWqQ-KnXzdY7ZSBGrVJRdkplyQD5_ts18GF3qqnlRobuuBIb0MpFSDGWHCI8onOoS',
        src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR1wLa6JQpFtYSYWqQ-KnXzdY7ZSBGrVJRdkplyQD5_ts18GF3qqnlRobuuBIb0MpFSDGWHCI8onOoS/pubhtml?widget=true',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR1wLa6JQpFtYSYWqQ-KnXzdY7ZSBGrVJRdkplyQD5_ts18GF3qqnlRobuuBIb0MpFSDGWHCI8onOoS/pubhtml',
        height: 500,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })

    it('should keep a parameter it does not know as written', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2E0Uyt2V1s_BqvXIsSojR_5GQDFG-SfpaxbgdxGR3pOrEEKu4qrhcjT0ZTtkGsFV1E_6MU36bLk3A/pubhtml?widget=true&width='
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '2PACX-1vT2E0Uyt2V1s_BqvXIsSojR_5GQDFG-SfpaxbgdxGR3pOrEEKu4qrhcjT0ZTtkGsFV1E_6MU36bLk3A',
        src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2E0Uyt2V1s_BqvXIsSojR_5GQDFG-SfpaxbgdxGR3pOrEEKu4qrhcjT0ZTtkGsFV1E_6MU36bLk3A/pubhtml?widget=true&width=',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2E0Uyt2V1s_BqvXIsSojR_5GQDFG-SfpaxbgdxGR3pOrEEKu4qrhcjT0ZTtkGsFV1E_6MU36bLk3A/pubhtml',
        height: 500,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the single sheet route of a sheet', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/1U3GGl7tMh_RcurZevHcKkAmnLKy90MfNvid05MeWju0/pubhtml/sheet?headers=false&gid=573553659&range=A1:E22'
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '1U3GGl7tMh_RcurZevHcKkAmnLKy90MfNvid05MeWju0',
        src: 'https://docs.google.com/spreadsheets/d/1U3GGl7tMh_RcurZevHcKkAmnLKy90MfNvid05MeWju0/pubhtml/sheet?headers=false&gid=573553659&range=A1:E22',
        url: 'https://docs.google.com/spreadsheets/d/1U3GGl7tMh_RcurZevHcKkAmnLKy90MfNvid05MeWju0/pubhtml',
        height: 500,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the chart and its interactive format of a published chart', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/12eGQA3Go0aBYEcbpwd8QddARuQiDCbsaO9XWV26UW6o/pubchart?oid=1123833282&format=interactive'
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '12eGQA3Go0aBYEcbpwd8QddARuQiDCbsaO9XWV26UW6o',
        src: 'https://docs.google.com/spreadsheets/d/12eGQA3Go0aBYEcbpwd8QddARuQiDCbsaO9XWV26UW6o/pubchart?oid=1123833282&format=interactive',
        url: 'https://docs.google.com/spreadsheets/d/12eGQA3Go0aBYEcbpwd8QddARuQiDCbsaO9XWV26UW6o/pubhtml',
        height: 371,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })

    it('should keep the image format of a chart published by its token', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vTer4F1dwvz5S6cFf_pr768UANwA6btXwwKCOCHteBJn5GOXkiXGj0wjHiVlU6xos8MWd56Y_pLsmAL/pubchart?oid=1703615479&format=image'
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '2PACX-1vTer4F1dwvz5S6cFf_pr768UANwA6btXwwKCOCHteBJn5GOXkiXGj0wjHiVlU6xos8MWd56Y_pLsmAL',
        src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTer4F1dwvz5S6cFf_pr768UANwA6btXwwKCOCHteBJn5GOXkiXGj0wjHiVlU6xos8MWd56Y_pLsmAL/pubchart?oid=1703615479&format=image',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTer4F1dwvz5S6cFf_pr768UANwA6btXwwKCOCHteBJn5GOXkiXGj0wjHiVlU6xos8MWd56Y_pLsmAL/pubhtml',
        height: 371,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a sheet framed on its edit page', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/1Dd9ne3X9TDQ5ZH2xB8u2Ndwi54lSBeF2AIlav9jifew/edit#gid=648248961'

      expect(googlesheetsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a sheet framed on its preview page', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/1dK6ywx4Zv0G-C8YE8cpnzses0R5MJAWA36SYVl74Pi0/preview'

      expect(googlesheetsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a chart drawn by the visualization api', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/1MtX643H0wJWuvAETl1UJTBxaMO8DN5niRRvfYRydDVs/gviz/chartiframe?oid=1063393785'

      expect(googlesheetsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a sheet on its html embed route', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/1ZXkA7dZDAvp78rfhz_HPurHEOrB_fM86sNvrQ5YDHFg/htmlembed'

      expect(googlesheetsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a sheet exported as a file', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/1ZXkA7dZDAvp78rfhz_HPurHEOrB_fM86sNvrQ5YDHFg/export?format=xlsx'

      expect(googlesheetsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a published sheet whose token the carrier wrote twice', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vRu96x6GEP9i0hMcHTcR72FzgU8LHKu6nY0-GPLiy2K6jl5GCvWuF-S7BlG1yLaZRyISf_OQ2ODnryr/2PACX-1vRu96x6GEP9i0hMcHTcR72FzgU8LHKu6nY0-GPLiy2K6jl5GCvWuF-S7BlG1yLaZRyISf_OQ2ODnryr/pubhtml'

      expect(googlesheetsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a sheet route with a foreign word before the id', () => {
      const value =
        'https://docs.google.com/spreadsheets/x/e/2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x/pubhtml'

      expect(googlesheetsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a sheet route that names no id', () => {
      const value = 'https://docs.google.com/spreadsheets/d/'

      expect(googlesheetsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore the legacy published sheet', () => {
      const value =
        'https://docs.google.com/spreadsheet/pub?key=0AuGPdilGXWBhdEZPbjRUQ0ZJSnhLLV91aHBWWVlXZ3c&output=html&widget=true'

      expect(googlesheetsResolveEmbed(value)).toBeUndefined()
    })

    it('should ignore a deck on the same host', () => {
      const value =
        'https://docs.google.com/presentation/d/e/2PACX-1vTrfBoW3wH95ukhsgLZ6cmoSYewTL4-eamSe5ajsiM6UJqYH50L6rdR_udIG40Gfw/pubhtml'

      expect(googlesheetsResolveEmbed(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should use a malformed published id as written, even if the player answers an error', () => {
      const value = 'https://docs.google.com/spreadsheets/d/e/2PACX-1v%2F..%2Fx/pubhtml'
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '2PACX-1v%2F..%2Fx',
        src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1v%2F..%2Fx/pubhtml',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1v%2F..%2Fx/pubhtml',
        height: 500,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })

    it('should drop an empty fragment', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZs0nSuXimq1nrFUgP_84KEuRfrbB3fGRXvsIWxswuG_ZQ7c-GaMB8vBKxWUqcXh85NCkXv76_6AYP/pubhtml?widget=true&headers=false#gid='
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '2PACX-1vQZs0nSuXimq1nrFUgP_84KEuRfrbB3fGRXvsIWxswuG_ZQ7c-GaMB8vBKxWUqcXh85NCkXv76_6AYP',
        src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZs0nSuXimq1nrFUgP_84KEuRfrbB3fGRXvsIWxswuG_ZQ7c-GaMB8vBKxWUqcXh85NCkXv76_6AYP/pubhtml?widget=true&headers=false',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZs0nSuXimq1nrFUgP_84KEuRfrbB3fGRXvsIWxswuG_ZQ7c-GaMB8vBKxWUqcXh85NCkXv76_6AYP/pubhtml',
        height: 500,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })

    it('should drop an empty pair from the query', () => {
      const value =
        'https://docs.google.com/spreadsheets/d/16a7PMTGa9WtCz7InV8beA229cJv1XMROpMbIrygJJ-M/pubhtml?gid=1618494729&single=true&widget=true&headers=false&&range=a1:j'
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '16a7PMTGa9WtCz7InV8beA229cJv1XMROpMbIrygJJ-M',
        src: 'https://docs.google.com/spreadsheets/d/16a7PMTGa9WtCz7InV8beA229cJv1XMROpMbIrygJJ-M/pubhtml?gid=1618494729&single=true&widget=true&headers=false&range=a1:j',
        url: 'https://docs.google.com/spreadsheets/d/16a7PMTGa9WtCz7InV8beA229cJv1XMROpMbIrygJJ-M/pubhtml',
        height: 500,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })
  })

  describe('the sign-in prefixes', () => {
    it('should frame a published sheet behind an account index on its own path', () => {
      const value =
        'https://docs.google.com/spreadsheets/u/2/d/e/2PACX-1vSycY-A50zVwI1MTL21nGd-CbjRD3hg6jOeujz18Rcy26K07py-fwJsmSkTbn89Lc1yfdREFGEHX7V9/pubhtml?gid=0&single=true'
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '2PACX-1vSycY-A50zVwI1MTL21nGd-CbjRD3hg6jOeujz18Rcy26K07py-fwJsmSkTbn89Lc1yfdREFGEHX7V9',
        src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSycY-A50zVwI1MTL21nGd-CbjRD3hg6jOeujz18Rcy26K07py-fwJsmSkTbn89Lc1yfdREFGEHX7V9/pubhtml?gid=0&single=true',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSycY-A50zVwI1MTL21nGd-CbjRD3hg6jOeujz18Rcy26K07py-fwJsmSkTbn89Lc1yfdREFGEHX7V9/pubhtml',
        height: 500,
      }

      expect(googlesheetsResolveEmbed(value)).toEqual(expected)
    })

    it('should ignore a published sheet behind a Workspace prefix', () => {
      const value =
        'https://docs.google.com/a/example.com/spreadsheets/d/e/2PACX-1vSycY-A50zVwI1MTL21nGd-CbjRD3hg6jOeujz18Rcy26K07py-fwJsmSkTbn89Lc1yfdREFGEHX7V9/pubhtml?gid=0&single=true'

      expect(googlesheetsResolveEmbed(value)).toBeUndefined()
    })
  })
})

describeForEachParser('googlesheetsEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, googlesheetsEmbedResolver)

  describe('happy paths', () => {
    it('should state the platform size over the box the carrier declares', async () => {
      const value = html`
        <iframe
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x/pubhtml?widget=true&amp;headers=false"
          width="100%"
          height="600"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x',
        src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x/pubhtml?widget=true&headers=false',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x/pubhtml',
        height: 500,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the title the carrier states', async () => {
      const value = html`
        <iframe
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x/pubhtml?widget=true&amp;headers=false"
          title="December 2025 Karate Grading Results"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x',
        src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x/pubhtml?widget=true&headers=false',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x/pubhtml',
        height: 500,
        title: 'December 2025 Karate Grading Results',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the height a chart carrier declares', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="505"
          scrolling="no"
          seamless=""
          src="https://docs.google.com/spreadsheets/d/1C4qR_gd-gNUlbywprKuVBdNw9Ap6zLsFNYsHSH87K-o/pubchart?oid=537273311&amp;format=interactive"
          width="600"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '1C4qR_gd-gNUlbywprKuVBdNw9Ap6zLsFNYsHSH87K-o',
        src: 'https://docs.google.com/spreadsheets/d/1C4qR_gd-gNUlbywprKuVBdNw9Ap6zLsFNYsHSH87K-o/pubchart?oid=537273311&format=interactive',
        url: 'https://docs.google.com/spreadsheets/d/1C4qR_gd-gNUlbywprKuVBdNw9Ap6zLsFNYsHSH87K-o/pubhtml',
        height: 505,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a chart height written with its unit', async () => {
      const value = html`
        <iframe
          width="712px"
          height="440px"
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTKLuizF9FWWvQ1yi8_IWs_wuGbEHpYLZg4B95ng98D6e0Kvi65-KN-k85rzBGkGQt4bt8HjDfpZBA5/pubchart?oid=703555483&amp;format=interactive"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '2PACX-1vTKLuizF9FWWvQ1yi8_IWs_wuGbEHpYLZg4B95ng98D6e0Kvi65-KN-k85rzBGkGQt4bt8HjDfpZBA5',
        src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTKLuizF9FWWvQ1yi8_IWs_wuGbEHpYLZg4B95ng98D6e0Kvi65-KN-k85rzBGkGQt4bt8HjDfpZBA5/pubchart?oid=703555483&format=interactive',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTKLuizF9FWWvQ1yi8_IWs_wuGbEHpYLZg4B95ng98D6e0Kvi65-KN-k85rzBGkGQt4bt8HjDfpZBA5/pubhtml',
        height: 440,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should read a fractional chart height as written', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="469.5"
          scrolling="no"
          seamless=""
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vS9iWeUBXWDgBwW4uHwtUrn21598gdZJkdCHPPDle-TxPIp3vWt5NQJ_iLtNMYQg-KPDUlpJ-Yw9T_4/pubchart?oid=13464762&amp;format=interactive"
          width="550"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '2PACX-1vS9iWeUBXWDgBwW4uHwtUrn21598gdZJkdCHPPDle-TxPIp3vWt5NQJ_iLtNMYQg-KPDUlpJ-Yw9T_4',
        src: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9iWeUBXWDgBwW4uHwtUrn21598gdZJkdCHPPDle-TxPIp3vWt5NQJ_iLtNMYQg-KPDUlpJ-Yw9T_4/pubchart?oid=13464762&format=interactive',
        url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9iWeUBXWDgBwW4uHwtUrn21598gdZJkdCHPPDle-TxPIp3vWt5NQJ_iLtNMYQg-KPDUlpJ-Yw9T_4/pubhtml',
        height: 469.5,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the chart default when the carrier declares no height', async () => {
      const value =
        '<iframe src="https://docs.google.com/spreadsheets/d/1nAONxXtIuFidW5_OjltMI_zKXT_y5v1c9LX2klC7zck/pubchart?oid=1031542142&amp;format=interactive"></iframe>'
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '1nAONxXtIuFidW5_OjltMI_zKXT_y5v1c9LX2klC7zck',
        src: 'https://docs.google.com/spreadsheets/d/1nAONxXtIuFidW5_OjltMI_zKXT_y5v1c9LX2klC7zck/pubchart?oid=1031542142&format=interactive',
        url: 'https://docs.google.com/spreadsheets/d/1nAONxXtIuFidW5_OjltMI_zKXT_y5v1c9LX2klC7zck/pubhtml',
        height: 371,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should state the chart default when the carrier declares a percentage', async () => {
      const value = html`
        <iframe
          height="100%"
          src="https://docs.google.com/spreadsheets/d/1nAONxXtIuFidW5_OjltMI_zKXT_y5v1c9LX2klC7zck/pubchart?oid=1031542142&amp;format=interactive"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'googlesheets',
        id: '1nAONxXtIuFidW5_OjltMI_zKXT_y5v1c9LX2klC7zck',
        src: 'https://docs.google.com/spreadsheets/d/1nAONxXtIuFidW5_OjltMI_zKXT_y5v1c9LX2klC7zck/pubchart?oid=1031542142&format=interactive',
        url: 'https://docs.google.com/spreadsheets/d/1nAONxXtIuFidW5_OjltMI_zKXT_y5v1c9LX2klC7zck/pubhtml',
        height: 371,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the same path', async () => {
      const value =
        '<iframe src="https://evil.test/spreadsheets/d/e/2PACX-1vRGFJDoBb2POn_awnKgtowDGlMDAdue4UQCM9HlSxOwl0GtF8j0pv3UAkRW6GiLDf5G13atG4Pysk4x/pubhtml"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })
  })
})

// Only an enclosure case reaches the path where claiming a file url would cost the reader the
// download.
describeForEachParser('googlesheets through the pipeline', (parseHtml) => {
  const convert = (value: string, enclosures?: Array<{ url: string; type: string }>) => {
    return transformContent(value, {
      parseHtmlFn: parseHtml,
      baseUrl: 'https://example.com/post',
      enclosures,
    })
  }

  it('should resolve a published sheet frame into its placeholder', async () => {
    const value = html`
      <iframe
        height="845"
        src="https://docs.google.com/spreadsheets/d/1cQ8dFdQARpQV-uzmLkEZZZX6m5PhyMClBagpK8yH1mI/pubhtml?gid=0&amp;single=true&amp;widget=true&amp;headers=false"
        width="865"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="500"
        data-embed-url="https://docs.google.com/spreadsheets/d/1cQ8dFdQARpQV-uzmLkEZZZX6m5PhyMClBagpK8yH1mI/pubhtml"
        data-embed-id="1cQ8dFdQARpQV-uzmLkEZZZX6m5PhyMClBagpK8yH1mI"
        data-embed-provider="googlesheets"
        data-embed-src="https://docs.google.com/spreadsheets/d/1cQ8dFdQARpQV-uzmLkEZZZX6m5PhyMClBagpK8yH1mI/pubhtml?gid=0&amp;single=true&amp;widget=true&amp;headers=false"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })

  it('should leave a sheet exported as a file downloadable', async () => {
    const enclosures = [
      {
        url: 'https://docs.google.com/spreadsheets/d/1ZXkA7dZDAvp78rfhz_HPurHEOrB_fM86sNvrQ5YDHFg/export?format=xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ]

    const expected = html`
      <p>Body</p>
      <div
        data-enclosure=""
        data-file-type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        data-file-name="export"
        data-file-url="https://docs.google.com/spreadsheets/d/1ZXkA7dZDAvp78rfhz_HPurHEOrB_fM86sNvrQ5YDHFg/export?format=xlsx"
      ></div>
    `

    expect(await convert('<p>Body</p>', enclosures)).toEqualHtml(expected)
  })
})
