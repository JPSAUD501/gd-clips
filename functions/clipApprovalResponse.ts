
import YAML from 'yaml'
import fs from 'fs'

import { readCustomId } from './common'
import { Client, ButtonInteraction, Message } from 'discord.js'
import { getFullUrl } from './providers'

export async function clipApprovalResponse (interaction: ButtonInteraction, Client: Client) {
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

  const clipInfo = {
    clipId: interactionData.gdClipId,
    clipCategory: interactionData.clipCategory,
    clipOwnerId: interactionData.clipAuthorDiscordId,
    clipProvider: interactionData.clipProvider,
    clipProviderId: interactionData.clipId
  }

  console.log(clipInfo)
  const clipFolderPath = `./../db/${interactionData.clipCategory}/${interactionData.gdClipId}`

  fs.mkdirSync(clipFolderPath, { recursive: true })
  fs.writeFileSync(`${clipFolderPath}/info.yaml`, YAML.stringify(clipInfo), 'utf8')

  // TODO: Download
}
