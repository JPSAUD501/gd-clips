import { Message, MessageEmbed } from 'discord.js'
import { google } from 'googleapis'
import { authorize } from './youtubeAuth'
import fs from 'fs'
import path from 'path'
import { getClipData } from './common'
import { config } from '../constants'
import { updateClipObject } from './clipObject'
import { getFullUrl } from './providers'

export async function uploadToYTClip (gdClipId: string, authorName: string, logMessage?: Message): Promise<string | Error> {
  const obtainedClipData = getClipData(gdClipId)
  if (obtainedClipData instanceof Error) return obtainedClipData
  const { clipData, path: clipDataPath } = obtainedClipData[0]
  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Iniciando envio ao YouTube do clipe!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Iniciando...')
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }
  const clipVideoPath = path.join(clipDataPath, 'clipEdited.mp4')
  const clipThumbnailPath = path.join(clipDataPath, 'thumbnail.png')
  if (!fs.readFileSync(clipVideoPath)) return new Error(`Clip edited YT not found for: ${gdClipId}`)
  if (!fs.readFileSync(clipThumbnailPath)) return new Error(`Clip thumbnail not found for: ${gdClipId}`)
  const clipTitle = `${authorName} - ${clipData.clipCategory}`
  const clipDescription: string = config['YT-CLIP-DESCRIPTION']
  if (!clipDescription) return new Error('Default description not found')
  const clipTags: string[] = config['DEFAULT-TAGS']
  if (!clipTags) return new Error('Default tags not found')
  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Iniciando envio ao YouTube do clipe!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Aguardando autenticação...')
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }
  const auth = await authorize()
  if (auth instanceof Error) return auth
  const service = google.youtube('v3')
  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Iniciando envio ao YouTube do clipe!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Fazendo upload...')
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }
  const uploadedVideo = await service.videos.insert({
    auth: auth,
    part: ['snippet,status'],
    requestBody: {
      snippet: {
        title: clipTitle,
        description: clipDescription,
        tags: clipTags,
        // TODO: categoryId: // Solo clip YT category ID,
        defaultLanguage: 'pt-BR',
        defaultAudioLanguage: 'pt-BR'
      },
      status: {
        privacyStatus: 'unlisted'
      }
    },
    media: {
      body: fs.createReadStream(clipVideoPath)
    }
  }).catch(console.error)
  if (!uploadedVideo) return new Error('Error uploading video')

  console.log(uploadedVideo.data)
  console.log('Video uploaded. Uploading the thumbnail now.')

  const ytVideoId = uploadedVideo.data.id
  if (!ytVideoId) return new Error('Error uploading video, no video ID')
  const clipLink = `https://www.youtube.com/watch?v=${ytVideoId}`

  const setThumbnail = await service.thumbnails.set({
    auth: auth,
    videoId: ytVideoId,
    media: {
      body: fs.createReadStream(clipThumbnailPath)
    }
  }).catch(console.error)
  if (!setThumbnail) return new Error('The API returned an error')
  const savedClipObject = updateClipObject(getFullUrl(clipData.clipProvider, clipData.clipProviderId), {
    youtubePostDate: new Date().toISOString()
  })
  if (savedClipObject instanceof Error) return savedClipObject
  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Envio ao YouTube do clipe!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Link do clipe:', clipLink)
          .addField('Progresso:', 'Enviado!')
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }
  return clipLink
}
