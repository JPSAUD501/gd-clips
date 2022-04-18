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
  clipRawUrl?: string,
}
export function checkIClipData (obj: any): boolean {
  const interfaceChecker = checker('IClipData', './interfaces').checkJson
  return interfaceChecker(JSON.stringify(obj))
}
