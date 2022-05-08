// Now we extract the showModal method
import { ButtonInteraction, Message, MessageEmbed, TextChannel } from 'discord.js'
import { newCustomId, readCustomId } from './common'
import { Modal, TextInputComponent, showModal, ModalSubmitInteraction } from 'discord-modals'
import { client, config } from '../constants'

export async function sendModalResponseRequestSAM (interaction: ButtonInteraction): Promise<void | Error> {
  const interactionData = readCustomId(interaction.customId)
  if (interactionData.type !== 'MRQSAM') return new Error('Invalid interaction type!')
  const clipAuthor = await client.users.fetch(interactionData.clipAuthorDiscordId).catch(console.error)
  if (!clipAuthor) return new Error(`Could not find discord user with id ${interactionData.clipAuthorDiscordId}`)
  const modal = new Modal() // We create a Modal
    .setCustomId(newCustomId({
      type: 'MRPSAM',
      status: interactionData.status,
      clipAuthorDiscordId: interactionData.clipAuthorDiscordId,
      gdClipId: interactionData.gdClipId
    }))
    .setTitle('Notificação para o autor do clipe!')
    .addComponents(
      new TextInputComponent()
        .setCustomId('MESSAGE')
        .setLabel(`Mensagem para ${clipAuthor.username}:`)
        .setStyle('LONG')
        .setMinLength(4)
        .setMaxLength(100)
        .setRequired(true))

  showModal(modal, {
    client: client,
    interaction: interaction
  })
}

export async function sendAuthorMessage (modal: ModalSubmitInteraction): Promise<void | Error> {
  const interactionData = readCustomId(modal.customId)
  if (interactionData.type !== 'MRPSAM') return new Error('Invalid modal type!')
  const firstResponse = modal.getTextInputValue('MESSAGE')
  const clipAuthor = await client.users.fetch(interactionData.clipAuthorDiscordId).catch(console.error)
  if (!clipAuthor) return new Error('Clip author not found!')
  const logChannel = client.channels.cache.get(config['BOT-LOG-CHANNEL-ID'])
  if (!logChannel) return new Error('Log channel not found!')
  if (!(logChannel instanceof TextChannel)) return new Error('Log channel is not a text channel!')
  if (!logChannel) return new Error('Bot log channel not found!')
  let embed: MessageEmbed = new MessageEmbed()
    .setTitle('Notificação para o autor do clipe!')
  if (interactionData.status === 'STB') {
    embed = new MessageEmbed()
      .setTitle('Mensagem da moderação do GD!')
      .setDescription(`Voce recebeu uma mensagem de moderação do GD em relação ao seu clipe de ID: ${interactionData.gdClipId}`)
      .addField('Mensagem:', firstResponse, true)
      .setFooter({ text: `Mensagem enviada por ${modal.user.username}` })
  }
  if (interactionData.status === 'A') {
    embed = new MessageEmbed()
      .setTitle('Mensagem da moderação do GD!')
      .setDescription(`Voce recebeu uma mensagem de moderação do GD em relação ao seu clipe autorizado para ser postado no YouTube de ID: ${interactionData.gdClipId}`)
      .addField('Mensagem:', firstResponse, true)
      .setFooter({ text: `Mensagem enviada por ${modal.user.username}` })
  }
  if (interactionData.status === 'D') {
    embed = new MessageEmbed()
      .setTitle('Mensagem da moderação do GD!')
      .setDescription(`Voce recebeu uma mensagem de moderação do GD em relação ao seu clipe negado de ID: ${interactionData.gdClipId}`)
      .addField('Mensagem:', firstResponse, true)
      .setFooter({ text: `Mensagem enviada por ${modal.user.username}` })
  }
  await logChannel.send({
    content: `Uma mensagem em relação ao clipe de ID: ${interactionData.gdClipId} foi enviada para o autor do clipe **"${clipAuthor.username}" - "${clipAuthor}"**!`,
    embeds: [embed]
  }).catch(console.error)
  await clipAuthor.send({ embeds: [embed] }).catch(console.error)
  const msg = await modal.reply({
    content: 'Mensagem enviada com sucesso!',
    ephemeral: false,
    fetchReply: true
  }).catch(console.error) as unknown as Message
  setTimeout(() => {
    if (msg) msg.delete().catch(console.error)
  }, 10000)
}
