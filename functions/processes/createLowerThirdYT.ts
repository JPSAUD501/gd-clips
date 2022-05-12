import { maxNameLowerThirdLength } from '../../constants'
import { getClipObject, getClipObjectFolder } from '../clipObject'
import path from 'path'
import fs from 'fs'
import HtmlToImg from 'node-html-to-image'
import { Message, MessageEmbed } from 'discord.js'
const lowerThirdYTHtml = fs.readFileSync('./media/lowerThirdYT.html', 'utf8')

export async function createLowerThirdYT (clipObjectId: string, logMessage?: Message): Promise<void | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Criando LowerThird YT!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Iniciando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)

  const clipObjectFolder = getClipObjectFolder(clipObjectId)
  if (clipObjectFolder instanceof Error) return clipObjectFolder
  const lowerThirdYTPath = path.join(clipObjectFolder, 'lowerThirdYT.png')
  const sharerVisibility: string = clipObject.providerChannelName ? 'true' : 'false'
  const sharerNameString = clipObject.sharerDiscordName.substring(0, maxNameLowerThirdLength)
  const authorNameString = clipObject.providerChannelName?.substring(0, maxNameLowerThirdLength) || sharerNameString
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Criando LowerThird YT!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Criando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  const lowerThird = await HtmlToImg({
    output: lowerThirdYTPath,
    html: lowerThirdYTHtml,
    transparent: true,
    content: { authorName: authorNameString, sharerVisibility, sharerName: sharerNameString }
  }).catch(err => { return new Error(`Error creating lower third: ${err}`) })
  if (lowerThird instanceof Error) return lowerThird
  if (!fs.existsSync(lowerThirdYTPath)) return new Error(`Lower third YT not found for: ${lowerThirdYTPath}`)

  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Criando LowerThird YT!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Finalizado!')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
}
