import { interactionCustomIdSeparator } from '../constants'
import { IRequestPermission, IModPermission } from '../interfaces'

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
