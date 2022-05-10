import { Message, MessageEmbed, User } from 'discord.js'
import { IQueueObject } from '../interfaces'
import { processClip } from './processClip'
import { config } from '../constants'

const queue: IQueueObject[] = []
const inProcess: IQueueObject[] = []

export async function startQueueProcessing (): Promise<void> {
  setInterval(async () => {
    if (queue.length === 0) return
    const maxSimultaneousClipsProcessing: number = config['MAX-SIMULTANEOUS-CLIPS-PROCESSING']
    if (!maxSimultaneousClipsProcessing) throw new Error('MAX-SIMULTANEOUS-CLIPS-PROCESSING not found in config.yaml')
    if (maxSimultaneousClipsProcessing < 1) throw new Error('MAX-SIMULTANEOUS-CLIPS-PROCESSING must be greater or equal to 1!')
    if (inProcess.length >= maxSimultaneousClipsProcessing) return await updateWaitingClipsLogMessages()
    const queueObject = queue.shift()
    if (!queueObject) return
    inProcess.push(queueObject)
    const { clipObjectId, authorUser, authorName, logMessage } = queueObject
    // --> Process Clip
    await processClip(clipObjectId, authorUser, authorName, logMessage)
    // <--
    const clipProcessDone = queueClipProcessDone(clipObjectId)
    if (clipProcessDone instanceof Error) throw clipProcessDone
  }, 10000)
}

export async function addToQueue (clipObjectId: string, clipUrl?: string, logMessage?: Message, authorUser?: User, clipAuthorName?: string): Promise<void | Error> {
  if (!authorUser && !clipAuthorName) return new Error('No author user or author name found!')
  queue.push({
    clipObjectId,
    clipUrl: clipUrl || undefined,
    authorUser: authorUser || undefined,
    authorName: clipAuthorName || undefined,
    logMessage: logMessage || undefined
  })
  const updatedWaitingClipsLogMessages = await updateWaitingClipsLogMessages()
  if (updatedWaitingClipsLogMessages instanceof Error) return updatedWaitingClipsLogMessages
}

async function updateWaitingClipsLogMessages (): Promise<void | Error> {
  for (const clipObject of queue) {
    if (!clipObject.logMessage) continue
    if (!clipObject.authorUser && !clipObject.authorName) return new Error('No author user or author name found!')
    const authorNameString = clipObject.authorName || clipObject.authorUser?.username
    if (!authorNameString) return new Error('No author name found!')
    const queueLength = queue.length
    const indexPositionInQueue = queue.findIndex(clip => {
      return clip.clipObjectId === clipObject.clipObjectId
    })
    if (indexPositionInQueue === -1) return new Error(`Clip not found in queue: ${clipObject.clipObjectId}`)
    const positionInQueue = indexPositionInQueue + 1
    await clipObject.logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Clipe na fila de processamento!')
          .addField('Clipe ID:', `[${clipObject.clipObjectId}](${clipObject.clipUrl})`)
          .addField('Autor do clipe: ', `${authorNameString}`)
          .addField('Posição na fila de processamento:', `${positionInQueue}/${queueLength}`)
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }
}

function queueClipProcessDone (clipObjectId: string): void | Error {
  const indexOfClipObject = inProcess.findIndex(clip => {
    return clip.clipObjectId === clipObjectId
  })
  if (indexOfClipObject === -1) return new Error(`Clip not found in inProcess: ${clipObjectId}`)
  inProcess.splice(indexOfClipObject, 1)
}
