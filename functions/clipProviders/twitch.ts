import axios from 'axios'
import fs from 'fs'
import { getVideoDurationInSeconds } from 'get-video-duration'
import ProgressBar from 'progress'
import { Message, MessageEmbed } from 'discord.js'
import { getClipObject } from '../clipObject'
import ytdl from 'youtube-dl-exec'
const timer = {
  start: 0,
  lastUpdate: 0
}

const twitchBaseUrl = {
  clipsTwitch: ['https://clips.twitch.tv/'],
  twitchTv: ['https://www.twitch.tv/', '/clip/'],
  mTwitch: ['https://m.twitch.tv/clip/']
}

export async function isTwitchValidUrl (message: string): Promise<boolean> {
  if (
    !twitchBaseUrl.clipsTwitch.every(part => message.includes(part)) &&
    !twitchBaseUrl.twitchTv.every(part => message.includes(part)) &&
    !twitchBaseUrl.mTwitch.every(part => message.includes(part))
  ) return false
  const urlResponse = await axios.get(message).catch(error => { return new Error(error) })
  if (urlResponse instanceof Error) return false
  if (urlResponse.status !== 200) return false
  return true
}

export function getTwitchVideoId (url: string): string {
  if (twitchBaseUrl.clipsTwitch.every(part => url.includes(part))) return url.split(twitchBaseUrl.clipsTwitch[0])[1].slice(url.split(twitchBaseUrl.clipsTwitch[0])[1].indexOf('-') + 1)
  if (twitchBaseUrl.twitchTv.every(part => url.includes(part))) return url.split(twitchBaseUrl.twitchTv[1])[1].slice(url.split(twitchBaseUrl.twitchTv[1])[1].indexOf('-') + 1)
  return url.split(twitchBaseUrl.mTwitch[1])[1].slice(url.split(twitchBaseUrl.mTwitch[1])[1].indexOf('-') + 1)
}

function sanitizeTwitchUrl (url: string): string {
  const newUrl = url.replace(twitchBaseUrl.mTwitch[0], twitchBaseUrl.clipsTwitch[0])
  return newUrl
}

export async function getTwitchDownloadData (objectId: string): Promise<{ downloadUrl: string; duration: number } | Error> {
  const clipObject = getClipObject(objectId)
  if (clipObject instanceof Error) return clipObject
  const url = sanitizeTwitchUrl(clipObject.url)
  const clip = await ytdl(url, { dumpSingleJson: true })
  const format = clip.formats.pop()
  if (!format) return new Error('Error while getting the video format')
  const downloadUrl = format.url
  const duration = await getVideoDurationInSeconds(downloadUrl)
  return {
    downloadUrl,
    duration
  }
}

export async function getTwitchInfoData (objectId: string): Promise<{ providerChannelName: string, providerClipName: string} | Error> {
  const clipObject = getClipObject(objectId)
  if (clipObject instanceof Error) return clipObject
  const url = sanitizeTwitchUrl(clipObject.url)
  const clip = await ytdl(url, { dumpSingleJson: true })
  const providerChannelName = clip.creator
  const providerClipName = clip.title
  return {
    providerChannelName,
    providerClipName
  }
}

export async function twitchDownloadClip (clipObjectId: string, clipVideoSavePath: string, logMessage?: Message): Promise<number | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Download do clipe - Twitch!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Iniciando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  const logMessageText = (progress: string) => {
    return `Baixando clipe do Twitch: ${clipObjectId} // Progresso: ${progress}`
  }
  if (!clipObject.downloadUrl) return new Error(`Clip download url not found for: ${clipObjectId}`)
  const dateStart = new Date().getTime()
  const clip = await axios.get(clipObject.downloadUrl, { responseType: 'stream' }).catch(error => { return new Error(error) })
  if (clip instanceof Error) return clip
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
            .setTitle('Download do clipe - Twitch!')
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
        .setTitle('Download do clipe - Twitch!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Finalizado!')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  console.log(`Clip downloaded for: ${clipObjectId}`)
  return dateEnd - dateStart
}
