import { interactionCustomIdSeparator, rootDbPath } from '../constants'
import { IRequestPermission, IModPermission, IClipData } from '../interfaces'
import moment from 'moment'
import fs from 'fs'
import YAML from 'yaml'
import path from 'path'

const separator = interactionCustomIdSeparator

export function newCustomId ({ ...args }: IRequestPermission | IModPermission) {
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

  throw new Error('Invalid type')
}

export function readCustomId (customId: string): IRequestPermission | IModPermission {
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

export function saveClipData (clipData: IClipData) {
  const day = moment(clipData.clipDate).format('YYYY-MM-DD')
  const clipPath = `../${rootDbPath}/${day}/${clipData.gdClipId}.yaml`
  fs.writeFileSync(clipPath, YAML.stringify(clipData), 'utf8')
}

export function getClipData (clipId: string): IClipData | Error {
  const paths = getPathsRecursively(rootDbPath)
  const videoDirPath = paths.find(path => path.endsWith(`/${clipId}`))
  if (!videoDirPath) return new Error(`Clip dir not found: ${clipId}`)
  const clipPath = path.join(videoDirPath, 'info.yaml')
  if (!fs.existsSync(clipPath)) return new Error(`Clip info.yaml not found for: ${clipPath}`)
  const clipData = fs.readFileSync(clipPath, 'utf8')
  const clipDataObj = YAML.parse(clipData)
  return clipDataObj as IClipData
}
