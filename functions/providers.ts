import { Message } from 'discord.js'
import { IUrlData } from '../interfaces'
import { getOutplayedDownloadData, getOutplayedVideoId, isOutplayedValidUrl, outplayedDownloadClip } from './clipsProviders/outplayed'
import { getClipData } from './common'
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

export function getDownloadData (provider: string, providerId: string): Promise<{ downloadUrl: string; videoDuration: number } | Error> {
  if (provider === 'outplayed') return getOutplayedDownloadData(providerId)
  throw new Error('Invalid provider')
}

export async function downloadClip (gdClipId: string, logMessage?: Message): Promise<void | Error> {
  const obtainedClipData = getClipData(gdClipId)
  if (obtainedClipData instanceof Error) return new Error(`Clip data not found for: ${gdClipId}`)
  const { clipData, path: clipDataPath } = obtainedClipData[0]
  const clipVideoSavePath = path.join(clipDataPath, 'clip.mp4')
  // if (fs.existsSync(clipVideoSavePath)) return new Error(`Clip already exists for: ${gdClipId}`)
  if (clipData.clipProvider === 'outplayed') {
    const outplayedDownloadedClip = await outplayedDownloadClip(clipData, clipVideoSavePath, logMessage)
    if (outplayedDownloadedClip instanceof Error) return outplayedDownloadedClip
  }
  if (!fs.existsSync(clipVideoSavePath)) return new Error(`A unknown error occurred while downloading clip for: ${gdClipId}`)
}
