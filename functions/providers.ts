import { Message } from 'discord.js'
import { IUrlData } from '../interfaces'
import { getOutplayedDownloadData, getOutplayedVideoId, isOutplayedValidUrl, outplayedDownloadClip } from './clipProviders/outplayed'
import { getClipObject, getClipObjectFolder, updateClipObject } from './clipObject'
import path from 'path'
import fs from 'fs'

export function isValidUrl (word: string): boolean {
  if (isOutplayedValidUrl(word)) return true
  return false
}

function getVideoProviderId (url: string): string {
  if (isOutplayedValidUrl(url)) return getOutplayedVideoId(url)
  throw new Error('Invalid URL')
}

function getProvider (url: string): string {
  if (isOutplayedValidUrl(url)) return 'outplayed'
  throw new Error('Invalid URL')
}

function getProviderColor (provider: string): string {
  if (provider === 'outplayed') return '#ff0000'
  throw new Error('Invalid provider')
}

export function getUrlData (url: string): IUrlData {
  const videoId = getVideoProviderId(url)
  const provider = getProvider(url)
  const providerColor = getProviderColor(provider)

  return {
    provider,
    providerId: videoId,
    providerColor
  }
}

export function getProviderBaseUrl (provider: string): string {
  if (provider === 'outplayed') return 'https://outplayed.tv/media/'
  throw new Error('Invalid provider')
}

export function getFullUrl (provider: string, providerId: string): string {
  return `${getProviderBaseUrl(provider)}${providerId}`
}

export function getDownloadData (provider: string, providerId: string): Promise<{ downloadUrl: string; duration: number } | Error> {
  if (provider === 'outplayed') return getOutplayedDownloadData(providerId)
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
      downloadTime: outplayedDownloadedClip
    })
    if (savedDownloadData instanceof Error) return savedDownloadData
    return
  }
  if (!fs.existsSync(clipVideoSavePath)) return new Error(`A unknown error occurred while downloading clip for: ${clipObjectId}`)
  return new Error(`Unknown provider: ${clipObject.provider}`)
}
