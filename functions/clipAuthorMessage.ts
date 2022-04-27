// Now we extract the showModal method
import { ButtonInteraction, Client, Message, MessageEmbed, TextChannel } from 'discord.js'
import { newCustomId, readCustomId } from './common'
import { Modal, TextInputComponent, showModal, ModalSubmitInteraction } from 'discord-modals'
import fs from 'fs'
import YAML from 'yaml'
const config = YAML.parse(fs.readFileSync('./config.yaml', 'utf8'))

export async function sendModalResponseRequestSAM (interaction: ButtonInteraction, Client: Client): Promise<void> {
  const interactionData = readCustomId(interaction.customId)
  if (interactionData.type !== 'MRQSAM') return
  const clipAuthor = await Client.users.fetch(interactionData.clipAuthorDiscordId).catch(console.error)
  if (!clipAuthor) return
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
    client: Client,
    interaction: interaction
  })
}

export async function sendAuthorMessage (modal: ModalSubmitInteraction, Client: Client): Promise<void> {
  const interactionData = readCustomId(modal.customId)
  if (interactionData.type !== 'MRPSAM') return
  await modal.deferReply({ ephemeral: false }).catch(console.error)
  const firstResponse = modal.getTextInputValue('MESSAGE')
  const clipAuthor = await Client.users.fetch(interactionData.clipAuthorDiscordId).catch(console.error)
  if (!clipAuthor) return
  const logChannel = Client.channels.cache.get(config['BOT-LOG-CHANNEL-ID']) as TextChannel
  if (!logChannel) return
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
  const msg = await modal.followUp({
    content: 'Mensagem enviada com sucesso!',
    ephemeral: false
  }).catch(console.error) as unknown as Message
  setTimeout(() => {
    msg.delete().catch(console.error)
  }, 10000)
}
