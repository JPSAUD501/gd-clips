import editly, { Config } from 'editly'
import fs from 'fs'
import path from 'path'
import HtmlToImg from 'node-html-to-image'
import { getClipData } from './common'
import { maxNameLowerThirdLength } from '../constants'
import { Client } from 'discord.js'
const lowerThirdHtml = fs.readFileSync('./media/lowerThird.html', 'utf8')

export async function editClip (gdClipId: string, Client?: Client, authorName?: string): Promise<void | Error> {
  const obtainedClipData = getClipData(gdClipId)
  if (obtainedClipData instanceof Error) return new Error(`Clip data not found for: ${gdClipId}`)
  const { clipData, path: clipDataPath } = obtainedClipData[0]
  console.log(clipData)
  const clipVideoPath = path.join(clipDataPath, 'clip.mp4')
  if (!fs.existsSync(clipVideoPath)) return new Error(`Clip video not found for: ${clipVideoPath}`)
  let authorNameString: string
  if (!authorName) {
    if (!Client) return new Error('Client or authorName are required')
    const authorUser = await Client.users.fetch(clipData.clipAuthorDiscordId)
    if (!authorUser) return new Error(`Author not found for: ${clipData.clipAuthorDiscordId}`)
    authorNameString = authorUser.username
  } else {
    authorNameString = authorName
  }
  authorNameString = authorNameString.substring(0, maxNameLowerThirdLength)

  const lowerThird = await HtmlToImg({
    output: path.join(clipDataPath, 'lowerThird.png'),
    html: lowerThirdHtml,
    transparent: true,
    content: { name: authorNameString }
  }).catch(err => { return new Error(`Error creating lower third: ${err}`) })
  if (lowerThird instanceof Error) return new Error(lowerThird.message)

  const editSpec: Config = {
    outPath: path.join(clipDataPath, 'clipEdited.mp4'),
    clips: [
      {
        layers: [
          { type: 'video', path: path.join(clipDataPath, 'clip.mp4') },
          { type: 'image-overlay', path: path.join(clipDataPath, 'lowerThird.png') }
        ]
      }
    ],
    keepSourceAudio: true,
    width: 1920,
    height: 1080,
    fps: 60
  }

  const editedClip = await editly(editSpec).catch(err => {
    console.error(err)
    return new Error(`Editly failed for: ${gdClipId}`)
  })
  if (editedClip instanceof Error) return new Error(editedClip.message)
  if (!fs.existsSync(editSpec.outPath)) return new Error(`Edited clip not found for: ${editSpec.outPath}`)
}
