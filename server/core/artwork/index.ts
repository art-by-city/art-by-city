import { ContainerModule } from 'inversify'
import { IsString, Matches } from 'class-validator'

import BaseControllerInterface from '../controller.interface'
import BaseApplicationServiceInterface from '../applicationService.interface'
import BaseRepositoryInterface from '../repository.interface'
import BaseDomainServiceInterface, {
  DomainServiceOptions
} from '../domainService.interface'
import ApiServiceResult from '../api/results/apiServiceResult.interface'
import { User } from '../user'

import Artwork from './artwork'
import ArtworkViewModel from './viewModels/artworkViewModel'
import ArtworkRepositoryImpl from './repository'
import ArtworkServiceImpl from './service'
import ArtworkApplicationServiceImpl from './appService'
import ArtworkControllerImpl from './controller'

export { default as Artwork } from './artwork'
export { default as ArtworkViewModel } from './viewModels/artworkViewModel'
export { default as ArtworkMapper } from './mapper'

export type ArtworkType =
  | 'Painting'
  | 'Illustration'
  | 'Drawing'
  | 'Sculpture'
  | 'Photograph'
  | 'Mixed-Media'
  | 'Digital'
  | 'Other'

export type Region =
  | 'Austin'
  | 'Boston'
  | 'Chicago'
  | 'Dallas'
  | 'Denver'
  | 'Houston'
  | 'Los Angeles'
  | 'New York City'
  | 'Philadelphia'
  | 'Phoenix'
  | 'Portland'
  | 'San Antonio'
  | 'San Diego'
  | 'San Jose'
  | 'Seattle'
  | 'Washington D.C.'

export class ArtworkImage {
  @IsString()
  @Matches(/\.(png|jpg)$/)
  source!: string
}

export interface ArtworkFilterOptions {
  city?: string
  type?: string
  hashtags?: string[]
  owner?: string
  likes?: string[]
  limit?: number
  shuffle?: boolean
  userId?: string
  lastFetchedArtworkId?: string
  includeUnpublished?: boolean
  includeUnapproved?: boolean
}

export interface ArtworkController extends BaseControllerInterface {}

export interface ArtworkApplicationService
  extends BaseApplicationServiceInterface {
  get(id: string): Promise<ApiServiceResult<ArtworkViewModel>>
  delete(user: User, id: string): Promise<ApiServiceResult<void>>
  create(
    request: any,
    files?: Express.Multer.File[]
  ): Promise<ApiServiceResult<ArtworkViewModel>>
  update(request: any): Promise<ApiServiceResult<ArtworkViewModel>>
  list(request: any): Promise<ApiServiceResult<ArtworkViewModel[]>>
  listByUser(user: User): Promise<ApiServiceResult<ArtworkViewModel[]>>
  listLikedByUser(user: User): Promise<ApiServiceResult<ArtworkViewModel[]>>
  like(user: User, id: string): Promise<ApiServiceResult<void>>
  unlike(user: User, id: string): Promise<ApiServiceResult<void>>
  publish(request: any): Promise<ApiServiceResult<void>>
  unpublish(request: any): Promise<ApiServiceResult<void>>
  approve(request: any): Promise<ApiServiceResult<void>>
  unapprove(request: any): Promise<ApiServiceResult<void>>
}

export interface ArtworkService extends BaseDomainServiceInterface<Artwork> {
  create(artwork: Artwork): Promise<Artwork | null>
  get(id: string, opts?: DomainServiceOptions): Promise<Artwork | null>
  update(artwork: Artwork): Promise<Artwork>
  delete(id: string): Promise<void>
  list(opts?: ArtworkFilterOptions): Promise<Artwork[]>
  listByUser(user: User): Promise<Artwork[]>
  listLikedByUser(user: User): Promise<Artwork[]>
}

export interface ArtworkRepository
  extends BaseRepositoryInterface<Artwork, ArtworkFilterOptions> {}

export const ArtworkModule = new ContainerModule((bind) => {
  bind<ArtworkRepository>(Symbol.for('ArtworkRepository')).to(
    ArtworkRepositoryImpl
  )
  bind<ArtworkService>(Symbol.for('ArtworkService')).to(ArtworkServiceImpl)
  bind<ArtworkApplicationService>(Symbol.for('ArtworkApplicationService')).to(
    ArtworkApplicationServiceImpl
  )
  bind<ArtworkController>(Symbol.for('ArtworkController')).to(
    ArtworkControllerImpl
  )
})
