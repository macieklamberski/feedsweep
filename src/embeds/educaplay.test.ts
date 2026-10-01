import { describe, expect, it } from 'bun:test'
import { transformContent } from '../index.js'
import { describeForEachParser, html, resolverExtractor } from '../tests.js'
import type { EmbedResolverResult } from '../types.js'
import { educaplayEmbedResolver } from './educaplay.js'

describeForEachParser('educaplayEmbedResolver', (parseHtml) => {
  const extract = resolverExtractor(parseHtml, educaplayEmbedResolver)

  describe('happy paths', () => {
    it('should build the placeholder from the game', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="300"
          src="https://www.educaplay.com/game/5225243-profissoes.html"
          width="400"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'educaplay',
        id: '5225243',
        src: 'https://www.educaplay.com/game/5225243-profissoes.html',
        url: 'https://www.educaplay.com/learning-resources/5225243-profissoes.html',
        height: 690,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild the Spanish game onto the current one', async () => {
      const value = html`
        <iframe
          allow="fullscreen; autoplay;"
          allowfullscreen=""
          frameborder="0"
          height="590"
          src="https://es.educaplay.com/juego/22109018-elementos_que_usamos_en_la_playa.html"
          width="595"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'educaplay',
        id: '22109018',
        src: 'https://www.educaplay.com/game/22109018-elementos_que_usamos_en_la_playa.html',
        url: 'https://www.educaplay.com/learning-resources/22109018-elementos_que_usamos_en_la_playa.html',
        height: 690,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild the French game onto the current one', async () => {
      const value = html`
        <iframe
          allow="fullscreen; autoplay; allow-top-navigation-by-user-activation"
          allowfullscreen
          width="795"
          height="690"
          frameborder="0"
          src="https://fr.educaplay.com/jeu/2281504-quel_delice.html"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'educaplay',
        id: '2281504',
        src: 'https://www.educaplay.com/game/2281504-quel_delice.html',
        url: 'https://www.educaplay.com/learning-resources/2281504-quel_delice.html',
        height: 690,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should take the name out of the stated title', async () => {
      const value = html`
        <iframe
          src="https://www.educaplay.com/game/5225243-profissoes.html"
          title="Game: Profissões"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'educaplay',
        id: '5225243',
        src: 'https://www.educaplay.com/game/5225243-profissoes.html',
        url: 'https://www.educaplay.com/learning-resources/5225243-profissoes.html',
        height: 690,
        title: 'Game: Profissões',
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should drop a tracker from the game url', async () => {
      const value = html`
        <iframe
          src="https://www.educaplay.com/game/5225243-profissoes.html?utm_source=blog"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'educaplay',
        id: '5225243',
        src: 'https://www.educaplay.com/game/5225243-profissoes.html',
        url: 'https://www.educaplay.com/learning-resources/5225243-profissoes.html',
        height: 690,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('sad paths', () => {
    it('should ignore a foreign host carrying the game path', async () => {
      const value = '<iframe src="https://evil.test/game/5225243-profissoes.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a foreign host carrying the retired html5 path', async () => {
      const value =
        '<iframe src="https://evil.test/es/recursoseducativos/4582251/html5/el_universo.htm"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a route word that is not a game', async () => {
      const value =
        '<iframe src="https://es.educaplay.com/coleccionx/5225243-profissoes.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a game route spelled in uppercase', async () => {
      const value = '<iframe src="https://es.educaplay.com/JUEGO/5225243-profissoes.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a game path under another segment', async () => {
      const value =
        '<iframe src="https://www.educaplay.com/x/game/5225243-profissoes.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a game path with a trailing segment', async () => {
      const value =
        '<iframe src="https://www.educaplay.com/game/5225243-profissoes.html/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a game with no slug', async () => {
      const value = '<iframe src="https://www.educaplay.com/game/5225243.html"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a retired html5 path under another segment', async () => {
      const value =
        '<iframe src="https://es.educaplay.com/x/es/recursoseducativos/4582251/html5/el_universo.htm"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore a retired html5 path with a trailing segment', async () => {
      const value =
        '<iframe src="https://es.educaplay.com/es/recursoseducativos/4582251/html5/el_universo.htm/extra"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the retired resource page that names no html5 player', async () => {
      const value =
        '<iframe src="https://es.educaplay.com/es/recursoseducativos/4582251/el_universo.htm"></iframe>'

      expect(await extract(value)).toBeUndefined()
    })

    it('should ignore the retired Flash activity, whose game url needs a slug it lacks', async () => {
      const value = html`
        <embed
          src="http://www.educaplay.com/es/actividades/799985/actividad_v1_01.swf"
          type="application/x-shockwave-flash"
          width="600"
          height="450"
          flashvars="actividad=799985"
        />
      `

      expect(await extract(value)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should keep the slug as the feed wrote it', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="690"
          src="http://fr.educaplay.com/fr/activiteeducatives/1695454/html5/____c_est_no_l_.htm"
          width="795"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'educaplay',
        id: '1695454',
        src: 'https://www.educaplay.com/game/1695454-____c_est_no_l_.html',
        url: 'https://www.educaplay.com/learning-resources/1695454-____c_est_no_l_.html',
        height: 690,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })

  describe('the retired html5 player', () => {
    it('should rebuild the Spanish resource onto the game', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="690"
          src="https://es.educaplay.com/es/recursoseducativos/4297362/html5/lessico.htm"
          width="795"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'educaplay',
        id: '4297362',
        src: 'https://www.educaplay.com/game/4297362-lessico.html',
        url: 'https://www.educaplay.com/learning-resources/4297362-lessico.html',
        height: 690,
      }

      expect(await extract(value)).toEqual(expected)
    })

    it('should rebuild the resource on the main host onto the game', async () => {
      const value = html`
        <iframe
          frameborder="0"
          height="690"
          src="http://www.educaplay.com/es/recursoseducativos/1711436/html5/partes_de_un_dragon.htm"
          width="795"
        ></iframe>
      `
      const expected: EmbedResolverResult = {
        provider: 'educaplay',
        id: '1711436',
        src: 'https://www.educaplay.com/game/1711436-partes_de_un_dragon.html',
        url: 'https://www.educaplay.com/learning-resources/1711436-partes_de_un_dragon.html',
        height: 690,
      }

      expect(await extract(value)).toEqual(expected)
    })
  })
})

describeForEachParser('educaplay through the pipeline', (parseHtml) => {
  const convert = (value: string) => {
    return transformContent(value, { parseHtmlFn: parseHtml, baseUrl: 'https://example.com/post' })
  }

  it('should replace the retired html5 player with a game placeholder', async () => {
    const value = html`
      <iframe
        frameborder="0"
        height="690"
        src="https://es.educaplay.com/es/recursoseducativos/4582251/html5/el_universo.htm"
        width="795"
      ></iframe>
    `
    const expected = html`
      <div
        data-embed-height="690"
        data-embed-id="4582251"
        data-embed-provider="educaplay"
        data-embed-src="https://www.educaplay.com/game/4582251-el_universo.html"
        data-embed-url="https://www.educaplay.com/learning-resources/4582251-el_universo.html"
      ></div>
    `

    expect(await convert(value)).toEqualHtml(expected)
  })
})
