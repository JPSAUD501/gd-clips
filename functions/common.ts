import { config, interactionCustomIdSeparator, rootDbPath } from '../constants'
import { IRequestPermission, IModPermission, IClipData, checkIClipData, IModalRequestSendAuthorMessage, IModalResponseSendAuthorMessage } from '../interfaces'
import fs from 'fs'
import YAML from 'yaml'
import path from 'path'
import { getDownloadData } from './providers'
const separator = interactionCustomIdSeparator

export function newCustomId ({ ...args }: IRequestPermission | IModPermission | IModalRequestSendAuthorMessage | IModalResponseSendAuthorMessage): string {
  if (args.type === 'RP') { // Request Permission (RP)
    return `${
      args.type + separator +
      args.clipAuthorResponse + separator +
      args.clipAuthorDiscordId + separator +
      args.clipProvider + separator +
      args.clipProviderId
    }`
  }
  if (args.type === 'MP') { // Mod Permission (MP)
    return `${
      args.type + separator +
      args.gdClipId + separator +
      args.modResponse + separator +
      args.clipCategory + separator +
      args.clipAuthorDiscordId + separator +
      args.clipProvider + separator +
      args.clipProviderId
    }`
  }
  if (args.type === 'MRQSAM') { // Mod Permission (MP)
    return `${
      args.type + separator +
      args.status + separator +
      args.clipAuthorDiscordId + separator +
      args.gdClipId
    }`
  }
  if (args.type === 'MRPSAM') { // Mod Permission (MP)
    return `${
      args.type + separator +
      args.status + separator +
      args.clipAuthorDiscordId + separator +
      args.gdClipId
    }`
  }

  throw new Error('Invalid type')
}

export function readCustomId (customId: string): IRequestPermission | IModPermission | IModalRequestSendAuthorMessage | IModalResponseSendAuthorMessage {
  const args = customId.split(separator)
  const type = args.shift()

  if (type === 'RP') { // Request Permission (RP)
    const [clipAuthorResponse, clipAuthorDiscordId, clipProvider, clipProviderId] = args
    if (clipAuthorResponse !== 'Y' && clipAuthorResponse !== 'N') throw new Error('Invalid response')
    return {
      type,
      clipAuthorDiscordId,
      clipAuthorResponse,
      clipProvider,
      clipProviderId
    }
  }

  if (type === 'MP') { // Mod Permission (MP)
    const [gdClipId, modResponse, clipCategory, clipAuthorDiscordId, clipProvider, clipProviderId] = args
    if (modResponse !== 'Y' && modResponse !== 'N') throw new Error('Invalid response')
    if (clipCategory !== 'FUNNY' && clipCategory !== 'EPIC' && clipCategory !== 'TRASH') throw new Error('Invalid category')
    return {
      type,
      gdClipId,
      modResponse,
      clipCategory,
      clipAuthorDiscordId,
      clipProvider,
      clipProviderId
    }
  }

  if (type === 'MRQSAM') { // Modal Request Send Author Message (MRQSAM)
    const [status, clipAuthorDiscordId, gdClipId] = args
    if (status !== 'STB' && status !== 'A' && status !== 'D') throw new Error('Invalid status')
    return {
      type,
      status,
      clipAuthorDiscordId,
      gdClipId
    }
  }

  if (type === 'MRPSAM') { // Modal Response Send Author Message (MRPSAM)
    const [status, clipAuthorDiscordId, gdClipId] = args
    if (status !== 'STB' && status !== 'A' && status !== 'D') throw new Error('Invalid status')
    return {
      type,
      status,
      clipAuthorDiscordId,
      gdClipId
    }
  }

  throw new Error('Invalid type')
}

export function getPathsRecursively (dirPath: string): string[] {
  const listAllDirs = (directory: string): string[] => {
    let fileList: string[] = []
    const files = fs.readdirSync(directory)
    for (const file of files) {
      const p = path.join(directory, file)
      if ((fs.statSync(p)).isDirectory()) {
        fileList.push(p)
        fileList = [...fileList, ...(listAllDirs(p))]
      }
    }
    return fileList
  }
  const result = listAllDirs(dirPath)
  return result
}

export function saveClipData (clipData: IClipData): void | Error {
  if (!checkIClipData(clipData)) return new Error(`IClipData is invalid for: ${clipData}`)
  const clipDataDir = `${rootDbPath}/${clipData.clipCategory}/${clipData.gdClipId}`
  if (!fs.existsSync(`./${clipDataDir}`)) fs.mkdirSync(`./${clipDataDir}`, { recursive: true })
  const clipDataPath = `${rootDbPath}/${clipData.clipCategory}/${clipData.gdClipId}/info.yaml`
  fs.writeFileSync(clipDataPath, YAML.stringify(clipData), 'utf8')
}

export function updateClipData (gdClipId: string, { ...options }): void | Error {
  const clipDataObj = getClipData(gdClipId)
  if (clipDataObj instanceof Error) return clipDataObj
  const { clipData } = clipDataObj[0]
  const newClipData = { ...clipData, ...options }
  if (!checkIClipData(newClipData)) return new Error(`IClipData is invalid for: ${clipData}`)
  const clipDataDir = `${rootDbPath}/${clipData.clipCategory}/${clipData.gdClipId}`
  if (!fs.existsSync(`./${clipDataDir}`)) fs.mkdirSync(`./${clipDataDir}`, { recursive: true })
  const clipDataPath = `${rootDbPath}/${clipData.clipCategory}/${clipData.gdClipId}/info.yaml`
  fs.writeFileSync(clipDataPath, YAML.stringify(newClipData), 'utf8')
}

export function getClipData (gdClipId: string): { path: string, clipData: IClipData }[] | Error {
  const paths = getPathsRecursively(rootDbPath)
  const videosDirPath = []
  for (const path of paths) {
    if (path.endsWith(`/${gdClipId}`)) {
      videosDirPath.push(path)
    }
  }
  if (videosDirPath.length === 0) return new Error(`No clip data found for: ${gdClipId}`)
  const clipsData: {path: string, clipData: IClipData}[] = []
  for (const videoDirPath of videosDirPath) {
    const clipPath = path.join(videoDirPath, 'info.yaml')
    if (!fs.existsSync(clipPath)) return new Error(`Clip info.yaml not found for: ${clipPath}`)
    const clipData = fs.readFileSync(clipPath, 'utf8')
    const clipDataObj = YAML.parse(clipData) as IClipData
    if (!checkIClipData(clipDataObj)) return new Error(`Clip info.yaml | IClipData is invalid for: ${clipPath}`)
    clipsData.push({ path: videoDirPath, clipData: clipDataObj as IClipData })
  }
  return clipsData
}

export async function saveDownloadData (gdClipId: string): Promise<void | Error> {
  const obtainedClipData = getClipData(gdClipId)
  if (obtainedClipData instanceof Error) return new Error(`Clip data not found for: ${gdClipId}`)
  const { clipData } = obtainedClipData[0]
  const downloadData = await getDownloadData(clipData.clipProvider, clipData.clipProviderId)
  if (downloadData instanceof Error) return downloadData
  const { downloadUrl, videoDuration } = downloadData
  const saveDownloadData1 = updateClipData(clipData.gdClipId, {
    clipDownloadUrl: downloadUrl,
    clipDuration: videoDuration
  })
  if (saveDownloadData1 instanceof Error) return saveDownloadData1
}

export function checkMaxClipTime (gdClipId: string): void | Error {
  const obtainedClipData = getClipData(gdClipId)
  if (obtainedClipData instanceof Error) return new Error(`Clip data not found for: ${gdClipId}`)
  const { clipData } = obtainedClipData[0]
  if (!clipData.clipDuration) return new Error('Clip duration not found!')
  if (clipData.clipDuration === 0) return new Error('Invalid video duration!')
  const maxClipTime: number = config['MAX-CLIP-TIME']
  if (!maxClipTime) return new Error('MAX-CLIP-TIME not found in config.yaml')
  if (maxClipTime < 1) return new Error('MAX-CLIP-TIME must be greater or equal to 1!')
  if (clipData.clipDuration >= maxClipTime) return new Error(`Video duration is too long! Max: ${maxClipTime}`)
}
