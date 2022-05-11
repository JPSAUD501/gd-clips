import { Message } from 'discord.js'
import { IUrlData } from '../interfaces'
import { getOutplayedDownloadData, getOutplayedVideoId, isOutplayedValidUrl, outplayedDownloadClip } from './clipProviders/outplayed'
import { getClipObject, getClipObjectFolder, updateClipObject } from './clipObject'
import path from 'path'
import fs from 'fs'
import { discordDownloadClip, getDiscordDownloadData, getDiscordVideoId, isDiscordValidUrl } from './clipProviders/discord'

export async function isValidUrl (word: string): Promise<boolean> {
  if (await isOutplayedValidUrl(word)) return true
  if (await isDiscordValidUrl(word)) return true
  return false
}

async function getVideoProviderId (url: string): Promise<string> {
  if (await isOutplayedValidUrl(url)) return getOutplayedVideoId(url)
  if (await isDiscordValidUrl(url)) return getDiscordVideoId(url)
  throw new Error('Invalid URL')
}

async function getProvider (url: string): Promise<string> {
  if (await isOutplayedValidUrl(url)) return 'outplayed'
  if (await isDiscordValidUrl(url)) return 'discord'
  throw new Error('Invalid URL')
}

function getProviderColor (provider: string): string {
  if (provider === 'outplayed') return '#E0004B'
  if (provider === 'discord') return '#5865F2'
  throw new Error('Invalid provider')
}

export function isValidProvider (provider: string): boolean {
  if (provider === 'outplayed') return true
  if (provider === 'discord') return true
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

export async function getDownloadData (objectId: string): Promise<{ downloadUrl: string; duration: number } | Error> {
  const clipObject = getClipObject(objectId)
  if (clipObject instanceof Error) return clipObject
  if (clipObject.provider === 'outplayed') return await getOutplayedDownloadData(objectId)
  if (clipObject.provider === 'discord') return await getDiscordDownloadData(objectId)
  throw new Error('Invalid provider')
}

export async function downloadClip (clipObjectId: string, logMessage?: Message): Promise<void | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  const clipObjectFolder = getClipObjectFolder(clipObjectId)
  if (clipObjectFolder instanceof Error) return clipObjectFolder
  const clipVideoSavePath = path.join(clipObjectFolder, 'clip.mp4')
  if (clipObject.provider === 'outplayed') {
    const outplayedDownloadedClip = await outplayedDownloadClip(clipObjectId, clipVideoSavePath, logMessage)
    if (outplayedDownloadedClip instanceof Error) return outplayedDownloadedClip
    const savedDownloadData = updateClipObject(clipObjectId, {
      downloadTimer: outplayedDownloadedClip
    })
    if (savedDownloadData instanceof Error) return savedDownloadData
    return
  }
  if (clipObject.provider === 'discord') {
    const discordDownloadedClip = await discordDownloadClip(clipObjectId, clipVideoSavePath, logMessage)
    if (discordDownloadedClip instanceof Error) return discordDownloadedClip
    const savedDownloadData = updateClipObject(clipObjectId, {
      downloadTimer: discordDownloadedClip
    })
    if (savedDownloadData instanceof Error) return savedDownloadData
    return
  }
  if (!fs.existsSync(clipVideoSavePath)) return new Error(`A unknown error occurred while downloading clip for: ${clipObjectId}`)
  return new Error(`Unknown provider: ${clipObject.provider}`)
}
