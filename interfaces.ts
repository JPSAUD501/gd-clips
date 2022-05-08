/* eslint-disable camelcase */
import { Message, User } from 'discord.js'
import { checker } from 'ts-data-checker'

export interface IRequestPermission {
  type: 'RP',
  clipAuthorDiscordId: string,
  clipAuthorResponse: 'Y' | 'N',
  clipProvider: string,
  clipProviderId: string,
}
export function checkIRequestPermission (obj: any): boolean {
  const interfaceChecker = checker('IRequestPermission', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IModPermission {
  type: 'MP',
  gdClipId: string,
  modResponse: 'Y' | 'N',
  clipCategory: 'FUNNY' | 'EPIC' | 'TRASH',
  clipAuthorDiscordId: string,
  clipProvider: string,
  clipProviderId: string,
}
export function checkIModPermission (obj: any): boolean {
  const interfaceChecker = checker('IModPermission', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IModalRequestSendAuthorMessage {
  type: 'MRQSAM',
  status: 'STB' | 'A' | 'D',
  clipAuthorDiscordId: string,
  gdClipId: string,
}
export function checkISendAuthorMessage (obj: any): boolean {
  const interfaceChecker = checker('IModalRequestSendAuthorMessage', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IModalResponseSendAuthorMessage {
  type: 'MRPSAM',
  status: 'STB' | 'A' | 'D',
  clipAuthorDiscordId: string,
  gdClipId: string,
}
export function checkIModalResponseSendAuthorMessage (obj: any): boolean {
  const interfaceChecker = checker('IModalResponseSendAuthorMessage', './interfaces').checkJson
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

export interface IClipData {
  gdClipId: string,
  clipCategory: 'FUNNY' | 'EPIC' | 'TRASH',
  clipAuthorDiscordId: string,
  clipProvider: string,
  clipProviderId: string,
  clipDate: string,
  clipDownloadUrl?: string,
  clipDuration?: number,
  downloadTime?: number
}
export function checkIClipData (obj: any): boolean {
  const interfaceChecker = checker('IClipData', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IQueueObject {
  gdClipId: string,
  authorUser?: User,
  authorName?: string,
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
  authorDiscordId: string,
  firstApearDate: string,
  firstApearChannelId: string,
  postedOnClipsChannel?: boolean,
  clipsChannelPostDate?: string,
  postOnInternetResponse?: boolean,
  youtubePostDate?: string,
  instagramPostData?: string
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
