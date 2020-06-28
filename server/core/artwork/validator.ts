import { MAX_ARTWORK_HASHTAGS, MAX_ARTWORK_IMAGES } from '../../config'
import {
  ValidationRule,
  mapRules
} from '../validators/validationRule.interface'
import Artwork from './artwork'

export const artworkTypes = [
  'Painting',
  'Illustration',
  'Drawing',
  'Sculpture',
  'Photograph',
  'Mixed-Media',
  'Digital',
  'Other'
]

export const regions = [
  'Austin',
  'Boston',
  'Chicago',
  'Dallas',
  'Denver',
  'Houston',
  'Los Angeles',
  'New York City',
  'Philadelphia',
  'Phoenix',
  'Portland',
  'San Antonio',
  'San Diego',
  'San Jose',
  'Seattle',
  'Washington D.C.'
]

/**
 * Artwork - Title
 */
const MIN_TITLE_LENGTH = 1
const MAX_TITLE_LENGTH = 124
const _titleRules: ValidationRule[] = [
  {
    validate: (v: string) => v.length >= MIN_TITLE_LENGTH,
    message: 'Artwork Titles must be at least 1 character'
  },
  {
    validate: (v: string) => v.length <= MAX_TITLE_LENGTH,
    message: `Artwork Titles must be less than ${MAX_TITLE_LENGTH} characters`
  }
]
export const titleRules = () => {
  return _titleRules.map(mapRules)
}

/**
 * Artwork - Description
 */
const MAX_DESCRIPTION_LENGTH = 1024
const _descriptionRules: ValidationRule[] = [
  {
    validate: (v: string) => v.length <= MAX_DESCRIPTION_LENGTH,
    message: `Descriptions must be less than ${MAX_DESCRIPTION_LENGTH} characters`
  }
]
export const descriptionRules = () => {
  return _descriptionRules.map(mapRules)
}

/**
 * Artwork - Type
 */
const _typeRules: ValidationRule[] = [
  {
    validate: (v: string) => artworkTypes.includes(v),
    message: `Artwork Type must be one of [${artworkTypes.join(', ')}]`
  }
]
export const typeRules = () => {
  return _typeRules.map(mapRules)
}

/**
 * Artwork - Region
 */
const _regionRules: ValidationRule[] = [
  {
    validate: (v: string) => regions.includes(v),
    message: `Region must be one of [${regions.join(', ')}]`
  }
]
export const regionRules = () => {
  return _regionRules.map(mapRules)
}

/**
 * Artwork - Hashtags
 */
const MAX_HASHTAG_LENGTH = 124
const _hashtagRules: ValidationRule[] = [
  {
    validate: (v: string) => v.length <= MAX_HASHTAG_LENGTH,
    message: `Hashtags must be less than ${MAX_HASHTAG_LENGTH} characters`
  }
]
export const hashtagRules = () => {
  return _hashtagRules.map(mapRules)
}

export default class ArtworkValidator {
  validate(artwork: Artwork): string[] | null {
    const messages: string[] = []

    _titleRules.forEach((rule) => {
      if (!rule.validate(artwork.title)) {
        messages.push(rule.message)
      }
    })

    _descriptionRules.forEach((rule) => {
      if (!rule.validate(artwork.description)) {
        messages.push(rule.message)
      }
    })

    _typeRules.forEach((rule) => {
      if (!rule.validate(artwork.type)) {
        messages.push(rule.message)
      }
    })

    _regionRules.forEach((rule) => {
      if (!rule.validate(artwork.region)) {
        messages.push(rule.message)
      }
    })

    _hashtagRules.forEach((rule) => {
      const hashtags = artwork.hashtags || []
      hashtags.forEach((hashtag) => {
        if (!rule.validate(hashtag)) {
          messages.push(rule.message)
        }
      })
    })

    if (artwork.hashtags?.length > MAX_ARTWORK_HASHTAGS) {
      messages.push(`No more than ${MAX_ARTWORK_HASHTAGS} hashtags allowed`)
    }

    if (artwork.images?.length > MAX_ARTWORK_IMAGES) {
      messages.push(`No more than ${MAX_ARTWORK_IMAGES} images allowed`)
    }

    return messages.length > 0 ? messages : null
  }
}