/* eslint-disable camelcase */
import { Message } from 'discord.js'
import { checker } from 'ts-data-checker'

export type TLogOperators = 'UploadedToInstagram' |
                            'UploadedToInstagramStories' |
                            'UploadedToYoutube' |
                            'AddToNextCompilation' |
                            'Category'

type TClipCategories = string | 'TRASH'

export interface IRequestPermission {
  type: 'RP',
  clipObjectId: string,
  clipSharerDiscordId: string,
  clipSharerResponse: 'Y' | 'N'
}
export function checkIRequestPermission (obj: any): boolean {
  const interfaceChecker = checker('IRequestPermission', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IModPermission {
  type: 'MP',
  clipObjectId: string,
  modResponse: 'Y' | 'N',
  clipCategory: TClipCategories,
  clipSharerDiscordId: string
}
export function checkIModPermission (obj: any): boolean {
  const interfaceChecker = checker('IModPermission', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IModalRequestSendSharerMessage {
  type: 'MRQSAM',
  status: 'STB' | 'A' | 'D',
  clipSharerDiscordId: string,
  clipObjectId: string,
}
export function checkISendSharerMessage (obj: any): boolean {
  const interfaceChecker = checker('IModalRequestSendSharerMessage', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IModalResponseSendSharerMessage {
  type: 'MRPSAM',
  status: 'STB' | 'A' | 'D',
  clipSharerDiscordId: string,
  clipObjectId: string,
}
export function checkIModalResponseSendSharerMessage (obj: any): boolean {
  const interfaceChecker = checker('IModalResponseSendSharerMessage', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IUrlData {
  provider: string,
  providerId: string,
  providerColor: string
}
export function checkIUrlData (obj: any): boolean {
  const interfaceChecker = checker('IUrlData', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IQueueObject {
  clipObjectId: string,
  logMessage?: Message
}
export function checkIQueueObject (obj: any): boolean {
  const interfaceChecker = checker('IQueueObject', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IClipObject {
  objectId: string,
  provider: string,
  providerId: string,
  url: string,
  authorshipSystem: boolean,
  sharerDiscordId: string,
  sharerDiscordName: string,
  firstApearDate: string,
  firstApearChannelId: string,
  postedOnClipsChannel?: boolean,
  clipsChannelPostDate?: string,
  postOnInternetQuestionDate?: string,
  postOnInternetResponse?: boolean,
  category?: TClipCategories,
  downloadUrl?: string,
  duration?: number,
  downloadTimer?: number,
  providerChannelName?: string,
  providerClipName?: string,
  youtubePostDate?: string,
  instagramPostDate?: string
}
export function checkIClipObject (obj: any): boolean {
  const interfaceChecker = checker('IClipObject', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IClientSecret {
  installed: {
    client_id: string,
    project_id: string,
    auth_uri: string,
    token_uri: string,
    auth_provider_x509_cert_url: string,
    client_secret: string,
    redirect_uris: string[]
  }
}
export function checkIClientSecret (obj: any): boolean {
  const interfaceChecker = checker('IClientSecret', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}
