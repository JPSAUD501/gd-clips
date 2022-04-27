import { checker } from 'ts-data-checker'

export interface IRequestPermission {
  type: 'RP',
  clipAuthorDiscordId: string,
  clipAuthorResponse: 'Y' | 'N',
  clipProvider: string,
  clipId: string,
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
  clipId: string,
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

export interface IVideoData {
  id: string,
  provider: string,
  providerColor: string,
}
export function checkIVideoData (obj: any): boolean {
  const interfaceChecker = checker('IVideoData', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}

export interface IClipData {
  gdClipId: string,
  clipCategory: 'FUNNY' | 'EPIC' | 'TRASH',
  clipAuthorDiscordId: string,
  clipProvider: string,
  clipId: string,
  clipDate: string,
  clipDownloadUrl?: string,
  clipDuration?: number
}
export function checkIClipData (obj: any): boolean {
  const interfaceChecker = checker('IClipData', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}
