import { User } from '../../user'
import ApiServiceResult from './apiServiceResult.interface'

export interface AuthenticationResult extends ApiServiceResult<void> {
  user: User | null
  token: string | null
}