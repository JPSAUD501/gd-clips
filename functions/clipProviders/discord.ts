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

const discordBaseUrl = 'https://cdn.discordapp.com/attachments/'

export async function isDiscordValidUrl (message: string): Promise<boolean> {
  if (!message.includes(discordBaseUrl)) return false
  const urlResponse = await axios.get(message).catch(error => { return new Error(error) })
  if (urlResponse instanceof Error) return false
  if (urlResponse.status !== 200) return false
  return true
}

export function getDiscordVideoId (url: string): string {
  const discordClipId = url.split(discordBaseUrl)[1].split('/')[1]
  return discordClipId
}

export async function getDiscordDownloadData (objectId: string): Promise<{ downloadUrl: string; duration: number } | Error> {
  const clipObject = getClipObject(objectId)
  if (clipObject instanceof Error) return clipObject
  const downloadUrl = clipObject.url
  const html = await axios.get(downloadUrl).catch(error => { return new Error(error) })
  if (html instanceof Error) return new Error(`Error getting HTML: ${html}`)
  if (html.status !== 200) return new Error(`Error getting video data: ${html.status}`)
  const duration = await getVideoDurationInSeconds(downloadUrl)
  return {
    downloadUrl,
    duration
  }
}

export async function discordDownloadClip (clipObjectId: string, clipVideoSavePath: string, logMessage?: Message): Promise<number | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Download do clipe - Discord!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Iniciando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  const logMessageText = (progress: string) => {
    return `Baixando clipe do Discord: ${clipObjectId} // Progresso: ${progress}`
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
            .setTitle('Download do clipe - Discord!')
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
        .setTitle('Download do clipe - Discord!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Finalizado!')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  console.log(`Clip downloaded for: ${clipObjectId}`)
  return dateEnd - dateStart
}
