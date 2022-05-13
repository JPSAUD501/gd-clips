import { Message } from 'discord.js'
import { IUrlData } from '../interfaces'
import { getOutplayedDownloadData, getOutplayedVideoId, isOutplayedValidUrl, outplayedDownloadClip, getOutplayedInfoData } from './clipProviders/outplayed'
import { getClipObject, getClipObjectFolder, updateClipObject } from './clipObject'
import path from 'path'
import fs from 'fs'
import { discordDownloadClip, getDiscordDownloadData, getDiscordVideoId, isDiscordValidUrl, getDiscordInfoData } from './clipProviders/discord'
import { getTwitchDownloadData, getTwitchInfoData, getTwitchVideoId, isTwitchValidUrl, twitchDownloadClip } from './clipProviders/twitch'

export async function isValidUrl (word: string): Promise<boolean> {
  if (await isOutplayedValidUrl(word)) return true
  if (await isDiscordValidUrl(word)) return true
  if (await isTwitchValidUrl(word)) return true
  return false
}

async function getVideoProviderId (url: string): Promise<string> {
  if (await isOutplayedValidUrl(url)) return getOutplayedVideoId(url)
  if (await isDiscordValidUrl(url)) return getDiscordVideoId(url)
  if (await isTwitchValidUrl(url)) return getTwitchVideoId(url)
  throw new Error('Invalid URL')
}

async function getProvider (url: string): Promise<string> {
  if (await isOutplayedValidUrl(url)) return 'outplayed'
  if (await isDiscordValidUrl(url)) return 'discord'
  if (await isTwitchValidUrl(url)) return 'twitch'
  throw new Error('Invalid URL')
}

function getProviderColor (provider: string): string {
  if (provider === 'outplayed') return '#E0004B'
  if (provider === 'discord') return '#5865F2'
  if (provider === 'twitch') return '#6441A4'
  throw new Error('Invalid provider')
}

export function isValidProvider (provider: string): boolean {
  if (provider === 'outplayed') return true
  if (provider === 'discord') return true
  if (provider === 'twitch') return true
  return false
}

export async function getUrlData (url: string): Promise<IUrlData> {
  const videoId = await getVideoProviderId(url)
  const provider = await getProvider(url)
  const providerColor = getProviderColor(provider)

  return {
    provider,
    providerId: videoId,
    providerColor
  }
}

export function activateAuthorshipSystemForThisProvider (provider: string): boolean {
  if (provider === 'outplayed') return true
  if (provider === 'discord') return true
  if (provider === 'twitch') return false
  throw new Error('Invalid provider')
}

export async function getDownloadData (objectId: string): Promise<{ downloadUrl: string; duration: number } | Error> {
  const clipObject = getClipObject(objectId)
  if (clipObject instanceof Error) return clipObject
  if (clipObject.provider === 'outplayed') return await getOutplayedDownloadData(objectId)
  if (clipObject.provider === 'discord') return await getDiscordDownloadData(objectId)
  if (clipObject.provider === 'twitch') return await getTwitchDownloadData(objectId)
  throw new Error('Invalid provider')
}

export async function getInfoData (objectId: string): Promise<{ providerChannelName: string, providerClipName: string} | null | Error> {
  const clipObject = getClipObject(objectId)
  if (clipObject instanceof Error) return clipObject
  if (clipObject.provider === 'outplayed') return await getOutplayedInfoData(objectId)
  if (clipObject.provider === 'discord') return await getDiscordInfoData(objectId)
  if (clipObject.provider === 'twitch') return await getTwitchInfoData(objectId)
  throw new Error('Invalid provider')
}

export async function downloadClip (clipObjectId: string, logMessage?: Message): Promise<void | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  const clipObjectFolder = getClipObjectFolder(clipObjectId)
  if (clipObjectFolder instanceof Error) return clipObjectFolder
  const clipVideoSavePath = path.join(clipObjectFolder, 'clip.mp4')

  // Outplayed -->
  if (clipObject.provider === 'outplayed') {
    const outplayedDownloadedClip = await outplayedDownloadClip(clipObjectId, clipVideoSavePath, logMessage)
    if (outplayedDownloadedClip instanceof Error) return outplayedDownloadedClip
    const savedDownloadData = updateClipObject(clipObjectId, {
      downloadTimer: outplayedDownloadedClip
    })
    if (savedDownloadData instanceof Error) return savedDownloadData
    return
  } // <--

  // Discord -->
  if (clipObject.provider === 'discord') {
    const discordDownloadedClip = await discordDownloadClip(clipObjectId, clipVideoSavePath, logMessage)
    if (discordDownloadedClip instanceof Error) return discordDownloadedClip
    const savedDownloadData = updateClipObject(clipObjectId, {
      downloadTimer: discordDownloadedClip
    })
    if (savedDownloadData instanceof Error) return savedDownloadData
    return
  } // <--

  // Twitch -->
  if (clipObject.provider === 'twitch') {
    const twitchDownloadedClip = await twitchDownloadClip(clipObjectId, clipVideoSavePath, logMessage)
    if (twitchDownloadedClip instanceof Error) return twitchDownloadedClip
    const savedDownloadData = updateClipObject(clipObjectId, {
      downloadTimer: twitchDownloadedClip
    })
    if (savedDownloadData instanceof Error) return savedDownloadData
    return
  } // <--

  if (!fs.existsSync(clipVideoSavePath)) return new Error(`A unknown error occurred while downloading clip for: ${clipObjectId}`)
  return new Error(`Unknown provider: ${clipObject.provider}`)
}
