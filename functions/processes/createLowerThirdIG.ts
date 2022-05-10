import { maxNameLowerThirdLength } from '../../constants'
import { getClipObject, getClipObjectFolder } from '../clipObject'
import path from 'path'
import fs from 'fs'
import HtmlToImg from 'node-html-to-image'
import { Message, MessageEmbed } from 'discord.js'
const lowerThirdIGHtml = fs.readFileSync('./media/lowerThirdIG.html', 'utf8')

export async function createLowerThirdIG (clipObjectId: string, authorName: string, logMessage?: Message): Promise<void | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Criando LowerThird IG!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Iniciando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  const clipObjectFolder = getClipObjectFolder(clipObjectId)
  if (clipObjectFolder instanceof Error) return clipObjectFolder
  const lowerThirdIGPath = path.join(clipObjectFolder, 'lowerThirdIG.png')
  const authorNameString = authorName.substring(0, maxNameLowerThirdLength)
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Criando LowerThird IG!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Criando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  const lowerThird = await HtmlToImg({
    output: lowerThirdIGPath,
    html: lowerThirdIGHtml,
    transparent: true,
    content: { name: authorNameString }
  }).catch(err => { return new Error(`Error creating lower third: ${err}`) })
  if (lowerThird instanceof Error) return lowerThird
  if (!fs.existsSync(lowerThirdIGPath)) return new Error(`Lower third IG not found for: ${lowerThirdIGPath}`)
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Criando LowerThird IG!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Finalizado!')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
}
