import axios from 'axios'
import fs from 'fs'
import { getVideoDurationInSeconds } from 'get-video-duration'
import ProgressBar from 'progress'
import { Message, MessageEmbed } from 'discord.js'
import { getClipObject } from '../clipObject'
const timer = {
  start: 0,
  lastUpdate: 0
}

const outplayedBaseUrl = 'https://outplayed.tv/media/'

export async function isOutplayedValidUrl (message: string): Promise<boolean> {
  if (!message.includes(outplayedBaseUrl)) return false
  const urlResponse = await axios.get(message).catch(error => { return new Error(error) })
  if (urlResponse instanceof Error) return false
  if (urlResponse.status !== 200) return false
  if (!urlResponse.data.includes('<video src=')) return false
  return true
}

export function getOutplayedVideoId (url: string): string {
  const outplayedClipId = url.split(outplayedBaseUrl)[1].split(' ')[0]
  return outplayedClipId
}

export async function getOutplayedDownloadData (objectId: string): Promise<{ downloadUrl: string; duration: number } | Error> {
  const clipObject = getClipObject(objectId)
  if (clipObject instanceof Error) return clipObject
  const videoUrl = clipObject.url
  const html = await axios.get(videoUrl).catch(error => { return new Error(error) })
  if (html instanceof Error) return new Error(`Error getting HTML: ${html}`)
  if (html.status !== 200) return new Error(`Error getting video data: ${html.status}`)
  const htmlData = html.data
  const downloadUrl: string = htmlData.match(/<video src="(.*?)"/)[1]
  if (downloadUrl === undefined) return new Error('Error getting download URL')
  const duration = await getVideoDurationInSeconds(downloadUrl)
  return {
    downloadUrl,
    duration
  }
}

export async function getOutplayedInfoData (objectId: string): Promise<null> {
  return null
}

export async function outplayedDownloadClip (clipObjectId: string, clipVideoSavePath: string, logMessage?: Message): Promise<number | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Download do clipe - Outplayed!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Iniciando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  const logMessageText = (progress: string) => {
    return `Baixando clipe do Outplayed: ${clipObjectId} // Progresso: ${progress}`
  }
  if (!clipObject.downloadUrl) return new Error(`Clip download url not found for: ${clipObjectId}`)
  const dateStart = new Date().getTime()
  const clip = await axios.get(clipObject.downloadUrl, { responseType: 'stream' })
  const writer = fs.createWriteStream(clipVideoSavePath)
  clip.data.pipe(writer)
  const contentLengthString = clip.headers['content-length']
  const contentLength = Number(contentLengthString)
  if (isNaN(contentLength)) return new Error(`Content length is not a number for: ${clipObjectId}`)
  if (contentLength <= 0) return new Error(`Content length is not greater than 0 for: ${clipObjectId}`)
  const progress = new ProgressBar('downloading [:bar] :percent :etas', contentLength)
  timer.start = Date.now()
  clip.data.on('data', async (chunk: string | any[]) => {
    progress.tick(chunk.length)
    if (timer.lastUpdate + 2500 < Date.now()) {
      timer.lastUpdate = Date.now()
      console.log(logMessageText(`${progress.curr}/${progress.total.toString()}`))
      await logMessage?.edit({
        embeds: [
          new MessageEmbed()
            .setTitle('Download do clipe - Outplayed!')
            .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
            .addField('Progresso:', `${(progress.curr / progress.total * 100).toFixed(2)}%`)
            .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
        ]
      }).catch(console.error)
    }
  })
  const download = await new Promise((resolve, reject) => {
    clip.data.on('end', () => { resolve('success') })
    clip.data.on('error', (err: Error) => { reject(err) })
  })
  const dateEnd = new Date().getTime()
  if (download instanceof Error) return new Error(`Clip download failed 1 for: ${clipObjectId}`)
  if (download !== 'success') return new Error(`Clip download failed 2 for: ${clipObjectId}`)
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Download do clipe - Outplayed!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Finalizado!')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  console.log(`Clip downloaded for: ${clipObjectId}`)
  return dateEnd - dateStart
}
