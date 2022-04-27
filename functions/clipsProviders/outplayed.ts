import axios from 'axios'
import fs from 'fs'
import { getVideoDurationInSeconds } from 'get-video-duration'
import ProgressBar from 'progress'
import YAML from 'yaml'
import { Client, TextChannel } from 'discord.js'
import { getFullUrl } from '../providers'
import { IClipData } from '../../interfaces'
const config = YAML.parse(fs.readFileSync('./config.yaml', 'utf8'))

const outplayedBaseUrl = 'https://outplayed.tv/media/'

export function isOutplayedValidUrl (message: string): boolean {
  if (message.includes('https://outplayed.tv/media/')) return true
  return false
}

export function getOutplayedVideoId (url: string): string {
  const outplayedClipId = url.split(outplayedBaseUrl)[1].split(' ')[0]
  return outplayedClipId
}

export async function getOutplayedDownloadData (videoId: string): Promise<{ downloadUrl: string; videoDuration: number } | Error> {
  const videoUrl = getFullUrl('outplayed', videoId)
  const html = await axios.get(videoUrl).catch(error => { return new Error(error) })
  if (html instanceof Error) return new Error(`Error getting HTML: ${html}`)
  if (html.status !== 200) return new Error(`Error getting video data: ${html.status}`)
  const htmlData = html.data
  const downloadUrl: string = htmlData.match(/<video src="(.*?)"/)[1]
  if (downloadUrl === undefined) return new Error('Error getting download URL')
  const videoDuration = await getVideoDurationInSeconds(downloadUrl)
  return {
    downloadUrl: downloadUrl,
    videoDuration: videoDuration
  }
}

export async function outplayedDownloadClip (clipData: IClipData, clipVideoSavePath: string, Client: Client): Promise<void | Error> {
  const logMessageText = (progress: string) => {
    return `Downloading clip from outplayed: ${clipData.gdClipId} // Progress: ${progress}`
  }
  const logChannel = await Client.channels.fetch(config.logChannelId)
  if (!logChannel) return new Error(`Log channel not found for: ${config.logChannelId}`)
  if (!(logChannel instanceof TextChannel)) return new Error(`Log channel is not a text channel for: ${config.logChannelId}`)
  const logMessage = await logChannel.send(logMessageText('Starting...')).catch(console.error)
  if (!logMessage) return new Error(`Log message not sent for: ${clipData.gdClipId}`)
  if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
  const clip = await axios.get(clipData.clipDownloadUrl, { responseType: 'stream' })
  const writer = fs.createWriteStream(clipVideoSavePath)
  clip.data.pipe(writer)
  const contentLengthString = clip.headers['content-length']
  const contentLength = Number(contentLengthString)
  if (isNaN(contentLength)) return new Error(`Content length is not a number for: ${clipData.gdClipId}`)
  if (contentLength <= 0) return new Error(`Content length is not greater than 0 for: ${clipData.gdClipId}`)
  const progress = new ProgressBar('downloading [:bar] :percent :etas', contentLength)
  clip.data.on('data', async (chunk: string | any[]) => {
    progress.tick(chunk.length)
    // TODO: TEST - await logMessage.edit(logMessageText(progress.toString()))
    console.log(logMessageText(progress.toString()))
  })
  const download = await new Promise((resolve, reject) => {
    clip.data.on('end', () => { resolve('success') })
    clip.data.on('error', (err: Error) => { reject(err) })
  })
  if (download instanceof Error) {
    await logMessage.edit(logMessageText('Error ERR: 1')).catch(console.error)
    return new Error(`Clip download failed 1 for: ${clipData.gdClipId}`)
  }
  if (download !== 'success') {
    await logMessage.edit(logMessageText('Error ERR: 2')).catch(console.error)
    return new Error(`Clip download failed 2 for: ${clipData.gdClipId}`)
  }
  await logMessage.edit(logMessageText('Finished!')).catch(console.error)
  console.log(`Clip downloaded for: ${clipData.gdClipId}`)
}
