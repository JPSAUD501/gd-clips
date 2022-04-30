import { interactionCustomIdSeparator, rootDbPath } from '../constants'
import { IRequestPermission, IModPermission, IClipData, checkIClipData, IModalRequestSendAuthorMessage, IModalResponseSendAuthorMessage } from '../interfaces'
import moment from 'moment'
import fs from 'fs'
import YAML from 'yaml'
import path from 'path'
import { Message } from 'discord.js'
import { outplayedDownloadClip } from './clipsProviders/outplayed'
const separator = interactionCustomIdSeparator

export function newCustomId ({ ...args }: IRequestPermission | IModPermission | IModalRequestSendAuthorMessage | IModalResponseSendAuthorMessage): string {
  if (args.type === 'RP') { // Request Permission (RP)
    return `${
      args.type + separator +
      args.clipAuthorResponse + separator +
      args.clipAuthorDiscordId + separator +
      args.clipProvider + separator +
      args.clipId
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
      args.clipId
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
  console.log(customId)
  const args = customId.split(separator)
  const type = args.shift()

  if (type === 'RP') { // Request Permission (RP)
    const [clipAuthorResponse, clipAuthorDiscordId, clipProvider, clipId] = args
    if (clipAuthorResponse !== 'Y' && clipAuthorResponse !== 'N') throw new Error('Invalid response')
    return {
      type,
      clipAuthorDiscordId,
      clipAuthorResponse,
      clipProvider,
      clipId
    }
  }

  if (type === 'MP') { // Mod Permission (MP)
    const [gdClipId, modResponse, clipCategory, clipAuthorDiscordId, clipProvider, clipId] = args
    if (modResponse !== 'Y' && modResponse !== 'N') throw new Error('Invalid response')
    if (clipCategory !== 'FUNNY' && clipCategory !== 'EPIC' && clipCategory !== 'TRASH') throw new Error('Invalid category')
    return {
      type,
      gdClipId,
      modResponse,
      clipCategory,
      clipAuthorDiscordId,
      clipProvider,
      clipId
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
  const day = moment(clipData.clipDate).format('YYYY-MM-DD')
  const clipDataDir = `${rootDbPath}/${clipData.clipCategory}/${day}/${clipData.gdClipId}`
  if (!fs.existsSync(`./${clipDataDir}`)) fs.mkdirSync(`./${clipDataDir}`, { recursive: true })
  const clipDataPath = `${rootDbPath}/${clipData.clipCategory}/${day}/${clipData.gdClipId}/info.yaml`
  fs.writeFileSync(clipDataPath, YAML.stringify(clipData), 'utf8')
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
    const clipDataObj = YAML.parse(clipData)
    if (!checkIClipData(clipDataObj)) return new Error(`Clip info.yaml | IClipData is invalid for: ${clipPath}`)
    clipsData.push({ path: videoDirPath, clipData: clipDataObj as IClipData })
  }
  return clipsData
}

export async function downloadClip (gdClipId: string, logMessage?: Message): Promise<void | Error> {
  const obtainedClipData = getClipData(gdClipId)
  if (obtainedClipData instanceof Error) return new Error(`Clip data not found for: ${gdClipId}`)
  const { clipData, path: clipDataPath } = obtainedClipData[0]
  console.log(clipData)
  const clipVideoSavePath = path.join(clipDataPath, 'clip.mp4')
  // if (fs.existsSync(clipVideoSavePath)) return new Error(`Clip already exists for: ${gdClipId}`)
  if (clipData.clipProvider === 'outplayed') {
    const outplayedDownloadedClip = await outplayedDownloadClip(clipData, clipVideoSavePath, logMessage)
    if (outplayedDownloadedClip instanceof Error) return new Error(outplayedDownloadedClip.message)
  }
  if (!fs.existsSync(clipVideoSavePath)) return new Error(`A unknown error occurred while downloading clip for: ${gdClipId}`)
}
