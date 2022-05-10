/* eslint-disable camelcase */
import { Message, User } from 'discord.js'
import { checker } from 'ts-data-checker'

export interface IRequestPermission {
  type: 'RP',
  clipObjectId: string,
  clipAuthorDiscordId: string,
  clipAuthorResponse: 'Y' | 'N'
}
export function checkIRequestPermission (obj: any): boolean {
  const interfaceChecker = checker('IRequestPermission', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IModPermission {
  type: 'MP',
  clipObjectId: string,
  modResponse: 'Y' | 'N',
  clipCategory: 'FUNNY' | 'EPIC' | 'TRASH',
  clipAuthorDiscordId: string
}
export function checkIModPermission (obj: any): boolean {
  const interfaceChecker = checker('IModPermission', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IModalRequestSendAuthorMessage {
  type: 'MRQSAM',
  status: 'STB' | 'A' | 'D',
  clipAuthorDiscordId: string,
  clipObjectId: string,
}
export function checkISendAuthorMessage (obj: any): boolean {
  const interfaceChecker = checker('IModalRequestSendAuthorMessage', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IModalResponseSendAuthorMessage {
  type: 'MRPSAM',
  status: 'STB' | 'A' | 'D',
  clipAuthorDiscordId: string,
  clipObjectId: string,
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

export interface IQueueObject {
  clipObjectId: string,
  clipUrl?: string,
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
  url: string,
  authorDiscordId: string,
  firstApearDate: string,
  firstApearChannelId: string,
  postedOnClipsChannel?: boolean,
  clipsChannelPostDate?: string,
  postOnInternetResponse?: boolean,
  category?: 'FUNNY' | 'EPIC' | 'TRASH',
  downloadUrl?: string,
  duration?: number,
  downloadTimer?: number,
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
