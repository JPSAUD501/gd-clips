import { config, interactionCustomIdSeparator, logFilePath, rootDbPath } from '../constants'
import { IRequestPermission, IModPermission, IModalRequestSendSharerMessage, IModalResponseSendSharerMessage, TLogOperators } from '../interfaces'
import { getDownloadData, getInfoData } from './providers'
import { updateClipObject, getClipObject } from './clipObject'
import path from 'path'
import fs from 'fs'
import YAML from 'yaml'
const separator = interactionCustomIdSeparator

export function newCustomId ({ ...args }: IRequestPermission | IModPermission | IModalRequestSendSharerMessage | IModalResponseSendSharerMessage): string {
  if (args.type === 'RP') { // Request Permission (RP)
    return `${
      args.type + separator +
      args.clipObjectId + separator +
      args.clipSharerResponse + separator +
      args.clipSharerDiscordId
    }`
  }
  if (args.type === 'MP') { // Mod Permission (MP)
    return `${
      args.type + separator +
      args.clipObjectId + separator +
      args.modResponse + separator +
      args.clipCategory + separator +
      args.clipSharerDiscordId
    }`
  }
  if (args.type === 'MRQSAM') { // Mod Permission (MP)
    return `${
      args.type + separator +
      args.status + separator +
      args.clipSharerDiscordId + separator +
      args.clipObjectId
    }`
  }
  if (args.type === 'MRPSAM') { // Mod Permission (MP)
    return `${
      args.type + separator +
      args.status + separator +
      args.clipSharerDiscordId + separator +
      args.clipObjectId
    }`
  }

  throw new Error('Invalid type')
}

export function readCustomId (customId: string): IRequestPermission | IModPermission | IModalRequestSendSharerMessage | IModalResponseSendSharerMessage {
  const args = customId.split(separator)
  const type = args.shift()

  if (type === 'RP') { // Request Permission (RP)
    const [clipObjectId, clipSharerResponse, clipSharerDiscordId] = args
    if (clipSharerResponse !== 'Y' && clipSharerResponse !== 'N') throw new Error('Invalid response')
    return {
      type,
      clipObjectId,
      clipSharerResponse,
      clipSharerDiscordId
    }
  }

  if (type === 'MP') { // Mod Permission (MP)
    const [clipObjectId, modResponse, clipCategory, clipSharerDiscordId] = args
    if (modResponse !== 'Y' && modResponse !== 'N') throw new Error('Invalid response')
    return {
      type,
      clipObjectId,
      modResponse,
      clipCategory,
      clipSharerDiscordId
    }
  }

  if (type === 'MRQSAM') { // Modal Request Send Sharer Message (MRQSAM)
    const [status, clipSharerDiscordId, clipObjectId] = args
    if (status !== 'STB' && status !== 'A' && status !== 'D') throw new Error('Invalid status')
    return {
      type,
      status,
      clipSharerDiscordId,
      clipObjectId
    }
  }

  if (type === 'MRPSAM') { // Modal Response Send Sharer Message (MRPSAM)
    const [status, clipSharerDiscordId, clipObjectId] = args
    if (status !== 'STB' && status !== 'A' && status !== 'D') throw new Error('Invalid status')
    return {
      type,
      status,
      clipSharerDiscordId,
      clipObjectId
    }
  }

  throw new Error('Invalid type')
}

export async function saveDownloadData (clipObjectId: string): Promise<void | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return new Error(`Clip object not found for: ${clipObjectId}`)
  const downloadData = await getDownloadData(clipObject.objectId)
  if (downloadData instanceof Error) return downloadData
  const { downloadUrl, duration } = downloadData
  const saveDownloadData = updateClipObject(clipObject.objectId, {
    downloadUrl,
    duration
  })
  if (saveDownloadData instanceof Error) return saveDownloadData
}

export async function saveInfoData (clipObjectId: string): Promise<void | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return new Error(`Clip object not found for: ${clipObjectId}`)
  const infoData = await getInfoData(clipObject.objectId)
  if (infoData instanceof Error) return infoData
  if (!infoData) return
  const { providerChannelName, providerClipName } = infoData
  const saveInfoData = updateClipObject(clipObject.objectId, {
    providerChannelName,
    providerClipName
  })
  if (saveInfoData instanceof Error) return saveInfoData
}

export function checkMaxClipTime (clipObjectId: string): void | Error {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return new Error(`Clip object not found for: ${clipObjectId}`)
  if (!clipObject.duration) return new Error('Clip duration not found!')
  if (clipObject.duration === 0) return new Error('Invalid video duration!')
  const maxClipTime: number = config['MAX-CLIP-TIME']
  if (!maxClipTime) return new Error('MAX-CLIP-TIME not found in config.yaml')
  if (maxClipTime < 1) return new Error('MAX-CLIP-TIME must be greater or equal to 1!')
  if (clipObject.duration >= maxClipTime) return new Error(`Video duration is too long! Max: ${maxClipTime}`)
}

export function saveToLog (clipObjectId: string, logOperation: TLogOperators): void | Error {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return
  const logFileDir = path.join(rootDbPath, logFilePath, 'log.yaml')
  if (!fs.existsSync(logFileDir)) {
    fs.mkdirSync(logFileDir, { recursive: true })
    fs.writeFileSync(logFileDir, '')
  }
  const logFile = YAML.parse(fs.readFileSync(logFileDir, 'utf8'))
  if (!logFile) return new Error('Log file not found!')
  if (logOperation === 'Category') {
    if (!clipObject.category) return new Error('Clip category not found!')
    logFile.Category[clipObject.category].push(clipObject.objectId)
  }
  logFile[logOperation].push(clipObject.objectId)
}
