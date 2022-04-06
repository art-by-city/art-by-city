import {
  ImageArtwork,
  ArtworkImageWithPreviews,
  ImageArtworkManifest,
  LegacyArtwork,
  LegacyArtworkManifest
} from '~/app/core/artwork'
import { FactoryCreationError } from '~/app/core/error'
import { uuidv4 } from '~/app/util'

export default class ImageArtworkBuilder {
  build(
    id: string,
    opts: Partial<ImageArtworkManifest> | Partial<LegacyArtworkManifest>
  ): ImageArtwork | LegacyArtwork {
    if (!id) {
      throw new FactoryCreationError('missing id')
    }

    if (!opts.creator) {
      throw new FactoryCreationError('missing creator')
    }

    if (!opts.title) {
      throw new FactoryCreationError('missing title')
    }

    if (!opts.images) {
      throw new FactoryCreationError('missing images')
    }

    if ('version' in opts && opts.version) {
      if (!opts.published) {
        throw new FactoryCreationError('missing published')
      }

      if (!opts.slug) {
        throw new FactoryCreationError('missing slug')
      }

      return {
        ...opts,
        id,
        version: opts.version,
        published: opts.published,
        creator: opts.creator,
        title: opts.title,
        slug: opts.slug,
        images: opts.images.map(image => {
          return { guid: uuidv4(), ...image }
        }),
      }
    } else {
      const artwork: LegacyArtwork = {
        id,
        version: 0,
        published: opts.published,
        creator: opts.creator as { address: string },
        title: opts.title,
        slug: opts.slug || id,
        created: opts.created,
        description: opts.description,
        type: opts.type,
        license: opts.license,
        medium: opts.medium,
        city: opts.city,
        images: (opts.images as ArtworkImageWithPreviews[]).map(image => {
          return { guid: uuidv4(), ...image }
        })
      }

      return artwork
    }
  }
}