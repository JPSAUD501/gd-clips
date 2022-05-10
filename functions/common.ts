import { config, interactionCustomIdSeparator } from '../constants'
import { IRequestPermission, IModPermission, IModalRequestSendAuthorMessage, IModalResponseSendAuthorMessage } from '../interfaces'
import { getDownloadData } from './providers'
import { updateClipObject, getClipObject } from './clipObject'
const separator = interactionCustomIdSeparator

export function newCustomId ({ ...args }: IRequestPermission | IModPermission | IModalRequestSendAuthorMessage | IModalResponseSendAuthorMessage): string {
  if (args.type === 'RP') { // Request Permission (RP)
    return `${
      args.type + separator +
      args.clipObjectId + separator +
      args.clipAuthorResponse + separator +
      args.clipAuthorDiscordId
    }`
  }
  if (args.type === 'MP') { // Mod Permission (MP)
    return `${
      args.type + separator +
      args.clipObjectId + separator +
      args.modResponse + separator +
      args.clipCategory + separator +
      args.clipAuthorDiscordId
    }`
  }
  if (args.type === 'MRQSAM') { // Mod Permission (MP)
    return `${
      args.type + separator +
      args.status + separator +
      args.clipAuthorDiscordId + separator +
      args.clipObjectId
    }`
  }
  if (args.type === 'MRPSAM') { // Mod Permission (MP)
    return `${
      args.type + separator +
      args.status + separator +
      args.clipAuthorDiscordId + separator +
      args.clipObjectId
    }`
  }

  throw new Error('Invalid type')
}

export function readCustomId (customId: string): IRequestPermission | IModPermission | IModalRequestSendAuthorMessage | IModalResponseSendAuthorMessage {
  const args = customId.split(separator)
  const type = args.shift()

  if (type === 'RP') { // Request Permission (RP)
    const [clipObjectId, clipAuthorResponse, clipAuthorDiscordId] = args
    if (clipAuthorResponse !== 'Y' && clipAuthorResponse !== 'N') throw new Error('Invalid response')
    return {
      type,
      clipObjectId,
      clipAuthorResponse,
      clipAuthorDiscordId
    }
  }

  if (type === 'MP') { // Mod Permission (MP)
    const [clipObjectId, modResponse, clipCategory, clipAuthorDiscordId] = args
    if (modResponse !== 'Y' && modResponse !== 'N') throw new Error('Invalid response')
    if (clipCategory !== 'FUNNY' && clipCategory !== 'EPIC' && clipCategory !== 'TRASH') throw new Error('Invalid category')
    return {
      type,
      clipObjectId,
      modResponse,
      clipCategory,
      clipAuthorDiscordId
    }
  }

  if (type === 'MRQSAM') { // Modal Request Send Author Message (MRQSAM)
    const [status, clipAuthorDiscordId, clipObjectId] = args
    if (status !== 'STB' && status !== 'A' && status !== 'D') throw new Error('Invalid status')
    return {
      type,
      status,
      clipAuthorDiscordId,
      clipObjectId
    }
  }

  if (type === 'MRPSAM') { // Modal Response Send Author Message (MRPSAM)
    const [status, clipAuthorDiscordId, clipObjectId] = args
    if (status !== 'STB' && status !== 'A' && status !== 'D') throw new Error('Invalid status')
    return {
      type,
      status,
      clipAuthorDiscordId,
      clipObjectId
    }
  }

  throw new Error('Invalid type')
}

// export function getPathsRecursively (dirPath: string): string[] {
//   const listAllDirs = (directory: string): string[] => {
//     let fileList: string[] = []
//     const files = fs.readdirSync(directory)
//     for (const file of files) {
//       const p = path.join(directory, file)
//       if ((fs.statSync(p)).isDirectory()) {
//         fileList.push(p)
//         fileList = [...fileList, ...(listAllDirs(p))]
//       }
//     }
//     return fileList
//   }
//   const result = listAllDirs(dirPath)
//   return result
// }

export async function saveDownloadData (clipObjectId: string): Promise<void | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return new Error(`Clip object not found for: ${clipObjectId}`)
  const downloadData = await getDownloadData(clipObject.provider, clipObject.providerId)
  if (downloadData instanceof Error) return downloadData
  const { downloadUrl, duration } = downloadData
  const saveDownloadData1 = updateClipObject(clipObject.objectId, {
    downloadUrl,
    duration
  })
  if (saveDownloadData1 instanceof Error) return saveDownloadData1
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
