import { Message, MessageEmbed } from 'discord.js'
import { google } from 'googleapis'
import { authorize } from '../clients/youtubeAuth'
import fs from 'fs'
import path from 'path'
import { config } from '../../constants'
import { getClipObject, updateClipObject, getClipObjectFolder } from '../clipObject'

export async function uploadToYTClip (clipObjectId: string, authorName: string, logMessage?: Message): Promise<string | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Iniciando envio ao YouTube do clipe!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Iniciando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  const clipObjectFolder = getClipObjectFolder(clipObjectId)
  if (clipObjectFolder instanceof Error) return clipObjectFolder
  const clipVideoPath = path.join(clipObjectFolder, 'clipEdited.mp4')
  const clipThumbnailPath = path.join(clipObjectFolder, 'thumbnail.png')
  if (!fs.readFileSync(clipVideoPath)) return new Error(`Clip edited YT not found for: ${clipObjectId}`)
  if (!fs.readFileSync(clipThumbnailPath)) return new Error(`Clip thumbnail not found for: ${clipObjectId}`)
  if (!clipObject.category) return new Error('Clip category not found')
  const clipTitle = `${authorName} - ${clipObject.category}`
  const clipDescription: string = config['YT-CLIP-DESCRIPTION']
  if (!clipDescription) return new Error('Default description not found')
  const clipTags: string[] = config['DEFAULT-TAGS']
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Iniciando envio ao YouTube do clipe!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Aguardando autenticação...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  const auth = await authorize()
  if (auth instanceof Error) return auth
  const service = google.youtube('v3')
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Iniciando envio ao YouTube do clipe!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Fazendo upload...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  const uploadedVideo = await service.videos.insert({
    auth: auth,
    part: ['snippet,status'],
    requestBody: {
      snippet: {
        title: clipTitle,
        description: clipDescription,
        tags: clipTags,
        // categoryId: // Solo clip YT category ID,
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
  const savedClipObject = updateClipObject(clipObject.url, {
    youtubePostDate: new Date().toJSON()
  })
  if (savedClipObject instanceof Error) return savedClipObject
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Envio ao YouTube do clipe!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Link do clipe:', clipLink)
        .addField('Progresso:', 'Enviado!')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  return clipLink
}
