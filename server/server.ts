import express from 'express'
import bodyParser from 'body-parser'
import passport from 'passport'

import { container } from './inversify.config'
import DatabaseAdapter from './core/db/adapter.interface'
import { AuthController, AuthService } from './core/auth'
import { AdminController } from './core/admin'
import { ArtworkController } from './core/artwork'
import { UserController } from './core/user'
import { CityController } from './core/city'
import { ConfigController } from './core/config'
import { EventService } from './core/events'
import { AnalyticsController } from './core/analytics'

// Initialize Database
const databaseAdapter = container.get<DatabaseAdapter>(
  Symbol.for('DatabaseAdapter')
)
databaseAdapter.initialize()

// Authentication / Passport Config
const authService = container.get<AuthService>(Symbol.for('AuthService'))
passport.use(authService.getLocalAuthenticationStrategy())
passport.use(authService.getJwtAuthenticationStrategy())
passport.serializeUser(authService.serializeUser)
passport.deserializeUser(authService.deserializeUser)

// Express Config
const app = express()
app.use(passport.initialize())
app.use(bodyParser.json())

// Express Routing
app.use(
  '/auth',
  container.get<AuthController>(Symbol.for('AuthController')).getRouter()
)
app.use(
  '/admin',
  container.get<AdminController>(Symbol.for('AdminController')).getRouter()
)
app.use(
  '/artwork',
  container.get<ArtworkController>(Symbol.for('ArtworkController')).getRouter()
)
app.use(
  '/user',
  container.get<UserController>(Symbol.for('UserController')).getRouter()
)
app.use(
  '/city',
  container.get<CityController>(Symbol.for('CityController')).getRouter()
)
app.use(
  '/config',
  container.get<ConfigController>(Symbol.for('ConfigController')).getRouter()
)
app.use(
  '/analytics',
  container.get<AnalyticsController>(Symbol.for('AnalyticsController')).getRouter()
)

// Event Registration
container.get<EventService>(Symbol.for('EventService')).registerEvents()

export default app
