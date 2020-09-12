import { injectable, inject } from 'inversify'

import UsernameAlreadyTakenError from '../api/errors/usernameAlreadyTakenError'
import UnknownError from '../api/errors/unknownError'
import ApiServiceResult from '../api/results/apiServiceResult.interface'
import NotFoundError from '../api/errors/notFoundError'
import { EventService } from '../events'
import validateUser from './validator'
import { User, UserViewModel, UserService, UserRepository, UserMapper } from './'
import { UserEvents } from '../events/user'
import EmailAlreadyTakenError from '../api/errors/emailAlreadyTakenError'
import { InvitationService } from '../invitation'
import InvalidInvitationCodeError from '../api/errors/invalidInvitationCodeError'
import { UserAvatar } from './user'

@injectable()
export default class UserServiceImpl implements UserService {
  private userRepository: UserRepository
  private eventService: EventService
  private invitationService: InvitationService

  constructor(
    @inject(Symbol.for('UserRepository'))
    userRepository: UserRepository,
    @inject(Symbol.for('EventService'))
    eventService: EventService,
    @inject(Symbol.for('InvitationService'))
    invitationService: InvitationService
  ) {
    this.userRepository = userRepository
    this.eventService = eventService
    this.invitationService = invitationService
  }

  async register(req: any): Promise<UserViewModel> {
    const user = new User()
    user.id = ''
    user.created = new Date()
    user.updated = new Date()
    user.username = req.body?.username || ''
    user.email = req.body?.email || ''
    user.password = req.body?.password || ''
    user.city = req.body?.city || ''
    user.roles = []
    user.artworkCount = 0
    user.invitation = req.body?.inviteCode

    // TODO -> make this admin configurable
    if (user.invitation) {
      const invitation = await this.invitationService.get(user.invitation)
      if (invitation) {
        if (invitation.used) {
          throw new InvalidInvitationCodeError()
        }
      } else {
        throw new InvalidInvitationCodeError()
      }
    } else {
      throw new InvalidInvitationCodeError()
    }

    await validateUser(user)

    const existingUsernameUser = await this.userRepository.getByUsername(user.username)

    if (existingUsernameUser) {
      throw new UsernameAlreadyTakenError()
    }

    const existingEmailUser = await this.userRepository.getByEmail(user.email)

    if (existingEmailUser) {
      throw new EmailAlreadyTakenError()
    }

    try {
      const savedUser = await this.userRepository.create(user)

      this.eventService.emit(UserEvents.Account.Registered, savedUser.id)

      return new UserMapper().toViewModel(savedUser)
    } catch (error) {
      throw new UnknownError(error.message)
    }
  }

  async updatePassword(
    id: string,
    password: string
  ): Promise<ApiServiceResult<void>> {
    const validatePasswordUser = new User()
    validatePasswordUser.password = password

    await validateUser(validatePasswordUser, true)

    const user = await this.userRepository.get(id)

    if (!user) {
      throw new NotFoundError(new User())
    }

    try {
      user.updatePassword(password)
      user.updated = new Date()

      const updatedUser = await this.userRepository.update(user)

      if (!updatedUser) {
        return { success: false }
      }

      return { success: true }
    } catch (error) {
      throw new UnknownError(error.message)
    }
  }

  async setUserRoles(
    userId: string,
    roles: string[]
  ): Promise<ApiServiceResult<void>> {
    const validateRolesUser = new User()
    validateRolesUser.roles = roles

    await validateUser(validateRolesUser, true)

    const user = await this.userRepository.get(userId)

    if (!user) {
      return { success: false, messages: ['User not found'] }
    }

    try {
      user.setRoles(roles)
      user.updated = new Date()

      const savedUser = await this.userRepository.update(user)

      if (!savedUser) {
        throw new NotFoundError(new User())
      }

      return { success: true }
    } catch (error) {
      return { success: false, messages: ['Could not save user'] }
    }
  }

  async saveUser(user: User): Promise<ApiServiceResult<void>> {
    await validateUser(user)

    try {
      user.updated = new Date()
      const savedUser = await this.userRepository.update(user)

      if (!savedUser) {
        throw new NotFoundError(new User())
      }

      return { success: true }
    } catch (error) {
      return { success: false, messages: ['Could not save user'] }
    }
  }

  async updateUserAvatar(userId: string, avatar: UserAvatar): Promise<boolean> {
    try {
      const user = await this.userRepository.get(userId)
      if (user) {
        user.avatar = avatar
        const savedUser = await this.userRepository.update(user)
        if (savedUser) {
          return true
        }
      }
    } catch (error) {
      console.error(error)
    }

    return false
  }

  async authenticate(username: string, password: string): Promise<User | null> {
    const usernameUser = await this.userRepository.getByUsername(username)

    if (!usernameUser) {
      const emailUser = await this.userRepository.getByEmail(username)

      if (!emailUser || !emailUser.verifyPassword(password)) {
        return null
      }

      return emailUser
    }

    if (!usernameUser.verifyPassword(password)) {
      return null
    }

    return usernameUser
  }

  async getById(id: string): Promise<User | null> {
    const user = await this.userRepository.get(id)

    if (!user) {
      return null
    }

    return user
  }

  getByUsername(username: string): Promise<User | null> {
    return this.userRepository.getByUsername(username)
  }

  listUsers(): Promise<User[]> {
    return this.userRepository.list()
  }

  incrementUserArtworkCount(userId: string): Promise<void> {
    return this.userRepository.incrementUserArtworkCount(userId)
  }

  decrementUserArtworkCount(userId: string): Promise<void> {
    return this.userRepository.decrementUserArtworkCount(userId)
  }
}
