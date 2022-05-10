import { checkIClipObject, IClipObject } from '../interfaces'
import { getUrlData, isValidUrl } from './providers'
import fs from 'fs'
import { rootDbPath } from '../constants'
import path from 'path'
import YAML from 'yaml'

export function getClipObjectId (url: string): string | Error {
  if (!isValidUrl(url)) return new Error('Invalid URL')
  const urlData = getUrlData(url)
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

export function createClipObject (url: string, authorId: string, channelId: string): IClipObject | Error {
  const urlData = getUrlData(url)
  const clipObjectId = getClipObjectId(url)
  if (clipObjectId instanceof Error) return clipObjectId
  const clipObject: IClipObject = {
    objectId: clipObjectId,
    provider: urlData.provider,
    providerId: urlData.providerId,
    url: url,
    authorDiscordId: authorId,
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
  const savedClipObject = saveClipObject(newClipObject)
  if (savedClipObject instanceof Error) return savedClipObject
}

export function getClipObject (clipObjectId: string): IClipObject | Error {
  const clipObjectPath = getClipObjectPath(clipObjectId)
  if (clipObjectPath instanceof Error) return clipObjectPath
  if (!fs.existsSync(clipObjectPath)) return new Error('Clip object not found')
  const clipObject = YAML.parse(fs.readFileSync(clipObjectPath, 'utf8')) as IClipObject
  if (!checkIClipObject(clipObject)) return new Error('Invalid clip object')
  return clipObject
}

export function getClipObjectOrCreateOne (url: string, userId: string, channelId: string): IClipObject | Error {
  const clipObjectId = getClipObjectId(url)
  if (clipObjectId instanceof Error) return new Error('clipObjectId is not valid')
  const clipObjectPath = getClipObjectPath(clipObjectId)
  if (clipObjectPath instanceof Error) return clipObjectPath
  if (!fs.existsSync(clipObjectPath)) {
    const clipObject = createClipObject(url, userId, channelId)
    if (clipObject instanceof Error) return clipObject
    saveClipObject(clipObject)
  }
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  return clipObject
}
