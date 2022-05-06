import { TextChannel, Message } from 'discord.js'
import { client, config } from '../constants'

export async function sendGuildOwnerQuestion (question: string, responseIncludes: string): Promise<string | Error> {
  const filter = (message: Message) => message.content.includes(responseIncludes)
  const questionChannel = client.channels.cache.get(config['GUILD-OWNER-QUESTION-CHANNEL-ID'])
  if (!questionChannel) return new Error('Guild owner question channel not found!')
  if (!(questionChannel instanceof TextChannel)) return new Error('Guild owner question channel is not a text channel!')
  const questionMessage = await questionChannel.send(question).catch(console.error)
  if (!questionMessage) return new Error('Could not send guild owner question message!')
  const collector = questionChannel.createMessageCollector({ filter })
  const response = await new Promise((resolve: (value: string) => void | string) => {
    collector.on('collect', message => {
      collector.stop()
      message.delete().catch(console.error)
      resolve(message.content)
    })
  })
  questionMessage.delete().catch(console.error)
  return response
}
