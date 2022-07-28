import { Message, MessageEmbed } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { config, igClient } from '../../constants'
import { getClipObject, getClipObjectFolder } from '../clipObject'

export async function uploadImgToStoriesIG (clipObjectId: string, logMessage?: Message): Promise<string | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Iniciando envio ao Instagram do stories!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Iniciando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)

  const clipObjectFolder = getClipObjectFolder(clipObjectId)
  if (clipObjectFolder instanceof Error) return clipObjectFolder
  const imagePath = path.join(clipObjectFolder, 'stories.jpg')
  if (!fs.readFileSync(imagePath)) return new Error(`Stories IG not found for: ${clipObjectId}`)
  const clipDescription: string = config['IG-CLIP-DESCRIPTION']
  if (!clipDescription) return new Error('Default description not found')
  if (!clipObject.category) return new Error('Clip category not found')
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Envio ao Instagram do stories!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Enviando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  const publishResult = await igClient.publish.story({
    file: fs.readFileSync(imagePath)
  }
  ).catch(console.error)
  if (!publishResult) return new Error('Error publishing video')
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Envio ao Instagram do stories!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Finalizado...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  return ('ok')
}
