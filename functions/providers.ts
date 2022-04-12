import { IVideoData } from '../interfaces'
import { getOutplayedVideoId, isOutplayedValidUrl } from './clipsProviders/outplayed'

export function isValidUrl (message: string): boolean {
  if (isOutplayedValidUrl(message)) return true
  return false
}

function getVideoId (url: string): string {
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

export function getVideoData (url: string): IVideoData {
  const videoId = getVideoId(url)
  const provider = getProvider(url)
  const providerColor = getProviderColor(provider)

  return {
    id: videoId,
    provider,
    providerColor
  }
}

export function getProviderBaseUrl (provider: string): string {
  if (provider === 'outplayed') return 'https://outplayed.tv/media/'
  throw new Error('Invalid provider')
}

export function getFullUrl (provider: string, id: string): string {
  return `${getProviderBaseUrl(provider)}${id}`
}
