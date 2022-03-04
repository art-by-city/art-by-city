import { Context } from '@nuxt/types'
import Transaction from 'arweave/node/lib/transaction'

import {
  Artwork,
  ArtworkCreationOptions,
  FeedItem,
  LegacyArtwork
} from '~/types'
import { readFileAsArrayBufferAsync, uuidv4 } from '~/helpers'
import {
  ArtworkFactory,
  ArtworkManifestFactory,
  BundleFactory,
  DataItemFactory,
  SignerFactory
} from '~/factories'
import { LIKED_ENTITY_TAG } from './likes'
import { TransactionService, LikesService } from './'

export default class ArtworkService extends TransactionService {
  $likesService!: LikesService

  constructor(context: Context) {
    super(context)

    this.$likesService = context.$likesService
  }

  async createArtworkTransaction(artwork: ArtworkCreationOptions):
    Promise<Transaction> {
    const signer = await SignerFactory.create()

    const images = await Promise.all(
      artwork.images.map(async ({ url, type }) => {
        const blob = await fetch(url).then(r => r.blob())
        const buffer = await readFileAsArrayBufferAsync(blob)

        const image = new Uint8Array(buffer)
        const preview = new Uint8Array(buffer)

        return [
          await DataItemFactory.create(
            preview,
            signer,
            [{ name: 'Content-Type', value: type }]
          ),
          await DataItemFactory.create(
            image,
            signer,
            [{ name: 'Content-Type', value: type }]
          )
        ]
      })
    )

    const manifest = ArtworkManifestFactory.create(artwork, images)
    const manifestDataItem = await DataItemFactory.create(
      JSON.stringify(manifest),
      signer,
      [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'slug', value: artwork.slug },
        { name: 'Category', value: 'artwork' },
        { name: 'App-Name', value: this.config.app.name },
        { name: 'App-Version', value: this.config.app.version }
      ]
    )

    const bundle = BundleFactory.create([ manifestDataItem, ...images.flat() ])
    const tx = await this.$arweave.createTransaction({
      data: bundle.getRaw()
    })
    tx.addTag('App-Name', this.config.app.name)
    tx.addTag('App-Version', this.config.app.version)
    tx.addTag('Bundle-Format', 'binary')
    tx.addTag('Bundle-Version', '2.0.0')

    return tx
  }

  async fetchByTxIdOrSlug(txIdOrSlug: string, owner: string):
    Promise<Artwork | LegacyArtwork | null> {
    const result = await this.transactionFactory.searchTransactions(
      'artwork',
      owner,
      {
        type: 'application/json',
        sort: 'HEIGHT_DESC',
        tags: [{ tag: 'slug', value: txIdOrSlug }]
      }
    )

    if (result.transactions[0]) {
      return await this.fetch(result.transactions[0].id)
    }

    // If no slug matches, try treating it as a txid
    return txIdOrSlug.length === 43
      ? await this.fetch(txIdOrSlug)
      : null
  }

  async fetch(id: string): Promise<Artwork | LegacyArtwork | null> {
    try {
      // const txDataString = await this.$arweave.transactions.getData(id, {
      //   decode: true
      // })
      const { protocol, host, port } = this.config.api
      const res = await this.context.$axios.get(
        `${protocol}://${host}:${port}/tx/${id}/data`
      )
      const buffer = Buffer.from(res.data, 'base64')
      const txData = JSON.parse(buffer.toString())

      return new ArtworkFactory().build(id, txData)
    } catch (error) {
      console.error(error)

      return null
    }
  }

  async fetchFeed(
    creator?: string | string[] | null,
    cursor?: string,
    limit?: number
  ): Promise<FeedItem[]> {
    if (!creator) {
      switch (this.config.app.name) {
        case 'ArtByCity':
          creator = [
            'mKRPxOSIe08BddCnrL9en8C3hUGqwA5l1sUZilGsjDg',
            'zIe2L7WAptLeDdDUcGPOFtBkItZuRE2wE2GQh2LfFqc',
            'hyL5aEp4K7fd7hYEjKxi6caxjyL2UANONOnnnFe7jwc',
            'aJIPwBoPqt1FGaa4pRoMotuDZr68PHRAoXe3lUerFTs',
            '1KZdIq1mkiTjb1gf6f5c__MUkheFyU6UK8-MMciSKnE',
            'dYRuag6nzcdFXJ02_Ljf8ks-WDUrpAMeSI0agFd_ZBQ',
            '276ituk07Igo0QzT5sa_ISRXwp04T5RfzBwZHS808h4',
            '0EeHrLUiUepAW3IZ8ZrNRu8bxEOlumouTdMYKBPPPTM',
            '1cX5WcLKn2kPWmiXPKbRIPpAWm5YP9H1172HpkYN1QI',
            'qoFt_qa74r8rPAIeZVd7wJUdQwLi8_7NvDOxs1dWf3c',
            'A2JEmT4LTk5WeBUFRGESX07OR-FUbtqfdBlBl8ooB64',
            'k4fkc6NDiMmfVR06qX5P5XvAOlLi9J9fgBaa8pLvIBc',
            '6uzZ2xVslWpFib3BR-J731uogU-FRuKDUifFVRZq8xE',
            'CxuvfybNxiEPpXGqIbM7tzzdSYOlOW9VOUWkf0FWH4c',
            '9XaFpHnpswVxZ7juWnG5iK9tYocYG_EYRf9WRmzbfCQ'
          ]
          break
        case 'ArtByCity-Staging':
          creator = [
            'x3GW6wfBZ3wHTflETInuzJ5rOv_6JvlFi-dl6yYAr8Y',
            '07x1amh71n9OSHVbuZ4GRTrZSkJ9ZYkevGuXy70HJB4',
            'uc8wFvl6oJO0QymalfxFFCTLkdl2HmF9xQrWvzk8uXM',
            'LtILfPM8agd7RU6AaQmwh0SFEvxPu-tb06E_iHksvUM',
            'P9TlkKY8NEuiBWf-YGIcVV9ZVWjhh9WgtoM8ej8jhJ8',
            'lULoyhunyPeZGVrZnDnTfDBxS-XOFV-qaNphiwPH2Ps',

            'mKRPxOSIe08BddCnrL9en8C3hUGqwA5l1sUZilGsjDg',
            'zIe2L7WAptLeDdDUcGPOFtBkItZuRE2wE2GQh2LfFqc',
            'hyL5aEp4K7fd7hYEjKxi6caxjyL2UANONOnnnFe7jwc',
            'aJIPwBoPqt1FGaa4pRoMotuDZr68PHRAoXe3lUerFTs',
            '1KZdIq1mkiTjb1gf6f5c__MUkheFyU6UK8-MMciSKnE',
            'dYRuag6nzcdFXJ02_Ljf8ks-WDUrpAMeSI0agFd_ZBQ'
          ]
          break
        default:
          creator = [
            'MlV6DeOtRmakDOf6vgOBlif795tcWimgyPsYYNQ8q1Y',

            'mKRPxOSIe08BddCnrL9en8C3hUGqwA5l1sUZilGsjDg',
            'zIe2L7WAptLeDdDUcGPOFtBkItZuRE2wE2GQh2LfFqc',
            'hyL5aEp4K7fd7hYEjKxi6caxjyL2UANONOnnnFe7jwc',
            'aJIPwBoPqt1FGaa4pRoMotuDZr68PHRAoXe3lUerFTs',
            '1KZdIq1mkiTjb1gf6f5c__MUkheFyU6UK8-MMciSKnE'
          ]
      }
    }

    const result = await this.transactionFactory.searchTransactions(
      'artwork',
      creator,
      {
        type: 'application/json',
        sort: 'HEIGHT_DESC',
        tags: [],
        limit: limit || 9,
        cursor
      }
    )

    return this.buildFeed(result.transactions.map(tx => tx.id), result.cursor)
  }

  async fetchLikedArtworkFeed(address: string, cursor?: string):
    Promise<FeedItem[]> {
    const result = await this.$likesService.fetchUserLikes(address, cursor, 9)

    const likedEntityTxIds = result.transactions.map(tx => {
      try {
        const tags: { name: string, value: string }[] = (tx as any)._tags
        const likedEntityTag = tags.find((tag) => tag.name === LIKED_ENTITY_TAG)

        if (likedEntityTag) {
          return likedEntityTag.value
        }

        return ''
      } catch (err) {
        return ''
      }
    }).filter(txId => !!txId)

    return this.buildFeed(likedEntityTxIds, result.cursor)
  }

  private buildFeed(txs: string[], cursor: string): FeedItem[] {
    return txs.map((txId) => {
      const item = { guid: uuidv4(), category: 'artwork', txId, cursor }
      return item as FeedItem
    })
  }
}
