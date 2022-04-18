
import { readCustomId } from './common'
import { Client, ButtonInteraction, Message } from 'discord.js'
import { getFullUrl } from './providers'
import { IClipData } from '../interfaces'
import { saveClip } from './saveClip'

export async function clipApprovalResponse (interaction: ButtonInteraction, Client: Client): void {
  const interactionData = readCustomId(interaction.customId)
  if (interactionData.type !== 'MP') return

  const noApproval = async () => {
    await interaction.user.send(`Olá ${interaction.user.username}, seu clipe não será postado no YouTube pois ele foi negado por um moderador!`).catch(console.error)
    await interaction.reply({
      content: `O clipe: ${getFullUrl(interactionData.clipProvider, interactionData.clipId)} \n foi negado por **"${interaction.user.username}" - "${interaction.user}"**!`
    }).catch(console.error)
    if (!(interaction.message instanceof Message)) throw new Error('Invalid interaction message!')
    await interaction.message.delete().catch(console.error)
  }

  if (interactionData.modResponse === 'N') return noApproval()

  await interaction.reply({ content: `O clipe (${getFullUrl(interactionData.clipProvider, interactionData.clipId)}) foi aprovado por **"${interaction.user.username}" - "${interaction.user}"** para a categoria **${interactionData.clipCategory}**!` }).catch(console.error)
  if (!(interaction.message instanceof Message)) throw new Error('Invalid interaction message!')
  await interaction.message.delete().catch(console.error)

  const clipData: IClipData = {
    gdClipId: interactionData.gdClipId,
    clipCategory: interactionData.clipCategory,
    clipAuthorDiscordId: interactionData.clipAuthorDiscordId,
    clipProvider: interactionData.clipProvider,
    clipId: interactionData.clipId,
    clipDate: new Date().toJSON()
  }

  saveClip(clipData)
}
