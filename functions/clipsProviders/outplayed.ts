import axios from 'axios'
import fs from 'fs'
import { getVideoDurationInSeconds } from 'get-video-duration'
import ProgressBar from 'progress'
import { Message, MessageEmbed } from 'discord.js'
import { getFullUrl } from '../providers'
import { IClipData } from '../../interfaces'
const timer = {
  start: 0,
  lastUpdate: 0
}

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

export async function outplayedDownloadClip (clipData: IClipData, clipVideoSavePath: string, logMessage?: Message): Promise<void | Error> {
  const logMessageText = (progress: string) => {
    return `Baixando clipe do Outplayed: ${clipData.gdClipId} // Progresso: ${progress}`
  }
  if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
  const clip = await axios.get(clipData.clipDownloadUrl, { responseType: 'stream' })
  const writer = fs.createWriteStream(clipVideoSavePath)
  clip.data.pipe(writer)
  const contentLengthString = clip.headers['content-length']
  const contentLength = Number(contentLengthString)
  if (isNaN(contentLength)) return new Error(`Content length is not a number for: ${clipData.gdClipId}`)
  if (contentLength <= 0) return new Error(`Content length is not greater than 0 for: ${clipData.gdClipId}`)
  const progress = new ProgressBar('downloading [:bar] :percent :etas', contentLength)
  timer.start = Date.now()
  clip.data.on('data', async (chunk: string | any[]) => {
    progress.tick(chunk.length)
    if (timer.lastUpdate + 2500 < Date.now()) {
      timer.lastUpdate = Date.now()
      console.log(logMessageText(`${progress.curr}/${progress.total.toString()}`))
      if (logMessage) {
        if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
        await logMessage.edit({
          embeds: [
            new MessageEmbed()
              .setTitle('Iniciando edição do clipe!')
              .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
              .addField('Progresso:', `${progress.curr}/${progress.total.toString()}`)
          ]
        }).catch(console.error)
      }
    }
  })
  const download = await new Promise((resolve, reject) => {
    clip.data.on('end', () => { resolve('success') })
    clip.data.on('error', (err: Error) => { reject(err) })
  })
  if (download instanceof Error) {
    if (logMessage) {
      await logMessage.edit({
        embeds: [
          new MessageEmbed()
            .setTitle('Iniciando edição do clipe!')
            .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
            .addField('Progresso:', 'Error ERR: 1')
        ]
      }).catch(console.error)
    }
    return new Error(`Clip download failed 1 for: ${clipData.gdClipId}`)
  }
  if (download !== 'success') {
    if (logMessage) {
      await logMessage.edit({
        embeds: [
          new MessageEmbed()
            .setTitle('Iniciando edição do clipe!')
            .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
            .addField('Progresso:', 'Error ERR: 2')
        ]
      }).catch(console.error)
    }
    return new Error(`Clip download failed 2 for: ${clipData.gdClipId}`)
  }
  if (logMessage) {
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Iniciando edição do clipe!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Finished!')
      ]
    }).catch(console.error)
  }
  console.log(`Clip downloaded for: ${clipData.gdClipId}`)
}
