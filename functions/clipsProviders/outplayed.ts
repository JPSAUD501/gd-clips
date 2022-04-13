/* import axios from 'axios'
import fs from 'fs'
import { getVideoDurationInSeconds } from 'get-video-duration'

import { maxClipTime } from '../../constants' */

const outplayedBaseUrl = 'https://outplayed.tv/media/'

export function isOutplayedValidUrl (message: string): boolean {
  if (message.includes('https://outplayed.tv/media/')) return true
  return false
}

export function getOutplayedVideoId (url: string): string {
  const outplayedClipId = url.split(outplayedBaseUrl)[1].split(' ')[0]
  return outplayedClipId
}
