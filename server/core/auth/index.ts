import { ContainerModule } from 'inversify'
import { Strategy as JwtStrategy } from 'passport-jwt'
import { Strategy as LocalStrategy } from 'passport-local'

import BaseControllerInterface from '../controller.interface'
import { AuthenticationResult } from '../api/results/authenticationResult.interface'
import { User } from '../user'

import AuthServiceImpl from './service'
import AuthControllerImpl from './controller'

export interface AuthController extends BaseControllerInterface {}

export interface AuthService {
  getLocalAuthenticationStrategy(): LocalStrategy
  getJwtAuthenticationStrategy(): JwtStrategy
  sign(thing: any): string
  serializeUser(user: User, callback: Function): void
  deserializeUser(userId: string, callback: Function): void
  login(user: User): AuthenticationResult
}

export const AuthModule = new ContainerModule((bind) => {
  bind<AuthService>(Symbol.for('AuthService')).to(AuthServiceImpl)
  bind<AuthController>(Symbol.for('AuthController')).to(AuthControllerImpl)
})