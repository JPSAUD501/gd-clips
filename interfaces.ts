export interface IRequestPermission {
  type: 'RP',
  clipAuthorDiscordId: string,
  clipAuthorResponse: 'Y' | 'N',
  clipProvider: string,
  clipId: string,
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

export interface IVideoData {
  id: string,
  provider: string,
  providerColor: string,
}
