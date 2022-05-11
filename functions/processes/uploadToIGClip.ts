import { Message, MessageEmbed } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { config, igClient } from '../../constants'
import { getClipObject, updateClipObject, getClipObjectFolder } from '../clipObject'

export async function uploadToIGClip (clipObjectId: string, authorName: string, logMessage?: Message): Promise<string | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Iniciando envio ao Instagram do clipe!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Iniciando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)

  const clipObjectFolder = getClipObjectFolder(clipObjectId)
  if (clipObjectFolder instanceof Error) return clipObjectFolder
  const videoPath = path.join(clipObjectFolder, 'clipEditedIG.mp4')
  const coverPath = path.join(clipObjectFolder, 'cover.jpg')
  if (!fs.readFileSync(videoPath)) return new Error(`Clip edited IG not found for: ${clipObjectId}`)
  if (!fs.readFileSync(coverPath)) return new Error(`Clip cover not found for: ${clipObjectId}`)
  const clipDescription: string = config['IG-CLIP-DESCRIPTION']
  if (!clipDescription) return new Error('Default description not found')
  if (!clipObject.category) return new Error('Clip category not found')
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Envio ao Instagram do clipe!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Enviando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  const publishResult = await igClient.publish.video({
    video: fs.readFileSync(videoPath),
    coverImage: fs.readFileSync(coverPath),
    caption: `${authorName} - ${clipObject.category} // ${clipDescription}`
  }).catch(console.error)
  if (!publishResult) return new Error('Error publishing video')
  const savedClipObject = updateClipObject(clipObject.objectId, {
    instagramPostDate: new Date().toJSON()
  })
  if (savedClipObject instanceof Error) return savedClipObject
  if (!publishResult.media.code) return new Error('Error publishing video (No media code)')
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Envio ao Instagram do clipe!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Finalizado...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  return (`https://www.instagram.com/p/${publishResult.media.code}`)
}
