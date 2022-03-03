import { Bundle, DataItem } from 'arbundles'

import { SignerFactory } from '../'
import { longTo32ByteArray } from '~/helpers'

export default class BundleFactory {
  static async create(items: DataItem[]): Promise<Bundle> {
    const signer = await SignerFactory.create()
    const headers = Buffer.alloc(64 * items.length)
    const binaries = items.map((item, index) => {
      const header = Buffer.alloc(64)
      header.set(longTo32ByteArray(item.getRaw().byteLength), 0)
      header.set(item.rawId, 32)

      headers.set(header, 64 * index)

      return item.getRaw()
    })

    const buffer = Buffer.concat([
      longTo32ByteArray(items.length),
      headers,
      ...binaries
    ])

    return new Bundle(buffer)
  }
}
