import { checkIClipObject, IClipObject } from '../interfaces'
import { getFullUrl, getUrlData, isValidUrl } from './providers'
import fs from 'fs'
import { rootDbPath } from '../constants'
import path from 'path'
import YAML from 'yaml'

export function getClipObjectId (url: string): string | Error {
  if (!isValidUrl(url)) return new Error('Invalid URL')
  const urlData = getUrlData(url)
  return `${urlData.provider}@${urlData.providerId}`
}

export function getClipObjectPath (url: string): string | Error {
  const clipObjectId = getClipObjectId(url)
  if (clipObjectId instanceof Error) return clipObjectId
  const clipLogDbPath = path.join(rootDbPath, 'CLIPS-LOG', `${clipObjectId}.yaml`)
  return clipLogDbPath
}

export function createClipObject (url: string, authorId: string, channelId: string): IClipObject | Error {
  const urlData = getUrlData(url)
  const clipObjectId = getClipObjectId(url)
  if (clipObjectId instanceof Error) return clipObjectId
  const clipObject: IClipObject = {
    objectId: clipObjectId,
    provider: urlData.provider,
    providerId: urlData.providerId,
    authorDiscordId: authorId,
    firstApearDate: new Date().toJSON(),
    firstApearChannelId: channelId
  }
  return clipObject
}

export function saveClipObject (clipObject: IClipObject): void | Error {
  const clipUrl = getFullUrl(clipObject.provider, clipObject.providerId)
  const clipObjectPath = getClipObjectPath(clipUrl)
  if (clipObjectPath instanceof Error) return clipObjectPath
  if (!fs.existsSync(path.dirname(clipObjectPath))) fs.mkdirSync(path.dirname(clipObjectPath), { recursive: true })
  fs.writeFileSync(clipObjectPath, YAML.stringify(clipObject), 'utf8')
}

export function updateClipObject (url: string, { ...options }): void | Error {
  const clipObject = getClipObject(url)
  if (clipObject instanceof Error) return clipObject
  const newClipObject = { ...clipObject, ...options }
  if (!checkIClipObject(newClipObject)) return new Error(`IClipObject is invalid for: ${clipObject}`)
  const savedClipObject = saveClipObject(newClipObject)
  if (savedClipObject instanceof Error) return savedClipObject
}

export function getClipObject (url: string): IClipObject | Error {
  const clipObjectPath = getClipObjectPath(url)
  if (clipObjectPath instanceof Error) return clipObjectPath
  if (!fs.existsSync(clipObjectPath)) return new Error('Clip object not found')
  const clipObject = YAML.parse(fs.readFileSync(clipObjectPath, 'utf8')) as IClipObject
  if (!checkIClipObject(clipObject)) return new Error('Invalid clip object')
  return clipObject
}

export function getClipObjectOrCreateOne (url: string, userId: string, channelId: string): IClipObject | Error {
  const clipObjectPath = getClipObjectPath(url)
  if (clipObjectPath instanceof Error) return clipObjectPath
  if (!fs.existsSync(clipObjectPath)) {
    const clipObject = createClipObject(url, userId, channelId)
    if (clipObject instanceof Error) return clipObject
    saveClipObject(clipObject)
  }
  const clipObject = getClipObject(url)
  if (clipObject instanceof Error) return clipObject
  return clipObject
}
