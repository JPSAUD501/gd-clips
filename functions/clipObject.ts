import { checkIClipObject, IClipObject } from '../interfaces'
import { getUrlData, isValidUrl } from './providers'
import fs from 'fs'
import { client, rootDbPath } from '../constants'
import path from 'path'
import YAML from 'yaml'

export async function getClipObjectId (url: string): Promise<string | Error> {
  if (!await isValidUrl(url)) return new Error('Invalid URL')
  const urlData = await getUrlData(url)
  return `${urlData.provider}@${urlData.providerId}`
}

export function getClipObjectPath (clipObjectId: string): string | Error {
  const clipLogDbPath = path.join(rootDbPath, 'CLIPS-LOG', `${clipObjectId}.yaml`)
  return clipLogDbPath
}

export function getClipObjectFolder (clipObjectId: string): string | Error {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  if (!clipObject.category) return new Error('No category')
  const clipObjectFolder = path.join(rootDbPath, clipObject.category, clipObjectId)
  if (!fs.existsSync(clipObjectFolder)) fs.mkdirSync(clipObjectFolder, { recursive: true })
  return clipObjectFolder
}

export async function createClipObject (url: string, sharerId: string, channelId: string): Promise<IClipObject | Error> {
  const urlData = await getUrlData(url)
  const clipObjectId = await getClipObjectId(url)
  if (clipObjectId instanceof Error) return clipObjectId
  const sharerUser = await client.users.fetch(sharerId).catch(console.error)
  if (!sharerUser) return new Error('Sharer user not found')
  const clipObject: IClipObject = {
    objectId: clipObjectId,
    provider: urlData.provider,
    providerId: urlData.providerId,
    url: url,
    sharerDiscordId: sharerId,
    sharerDiscordName: sharerUser.username,
    firstApearDate: new Date().toJSON(),
    firstApearChannelId: channelId
  }
  return clipObject
}

export function saveClipObject (clipObject: IClipObject): void | Error {
  const clipObjectPath = getClipObjectPath(clipObject.objectId)
  if (clipObjectPath instanceof Error) return clipObjectPath
  if (!fs.existsSync(path.dirname(clipObjectPath))) fs.mkdirSync(path.dirname(clipObjectPath), { recursive: true })
  fs.writeFileSync(clipObjectPath, YAML.stringify(clipObject), 'utf8')
}

export function updateClipObject (clipObjectId: string, { ...options }): void | Error {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  const newClipObject = { ...clipObject, ...options }
  if (!checkIClipObject(newClipObject)) return new Error(`IClipObject is invalid for: ${newClipObject}`)
  if (newClipObject.objectId !== clipObjectId) return new Error(`IClipObject.objectId is invalid for: ${newClipObject}`)
  const savedClipObject = saveClipObject(newClipObject)
  if (savedClipObject instanceof Error) return savedClipObject
}

export function getClipObject (clipObjectId: string): IClipObject | Error {
  const clipObjectPath = getClipObjectPath(clipObjectId)
  if (clipObjectPath instanceof Error) return clipObjectPath
  if (!fs.existsSync(clipObjectPath)) return new Error('Clip object not found')
  const clipObject = YAML.parse(fs.readFileSync(clipObjectPath, 'utf8')) as IClipObject
  if (!checkIClipObject(clipObject)) return new Error('Invalid clip object')
  if (clipObject.objectId !== clipObjectId) return new Error('Clip object id mismatch')
  return clipObject
}

export async function getClipObjectOrCreateOne (url: string, userId: string, channelId: string): Promise<Error | IClipObject> {
  const clipObjectId = await getClipObjectId(url)
  if (clipObjectId instanceof Error) return new Error('clipObjectId is not valid')
  const clipObjectPath = getClipObjectPath(clipObjectId)
  if (clipObjectPath instanceof Error) return clipObjectPath
  if (!fs.existsSync(clipObjectPath)) {
    const clipObject = await createClipObject(url, userId, channelId)
    if (clipObject instanceof Error) return clipObject
    saveClipObject(clipObject)
  }
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  return clipObject
}
