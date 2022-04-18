import { getClipData, getPathsRecursively, saveClipData } from '../functions/common'
import { rootDbPath } from '../constants'
import fs from 'fs'
import { IClipData } from '../interfaces'

test('getPathsRecursively', async () => {
  if (!fs.existsSync(`./${rootDbPath}}/EPIC`)) fs.mkdirSync(`./${rootDbPath}/EPIC`, { recursive: true })
  if (!fs.existsSync(`./${rootDbPath}/FUNNY`)) fs.mkdirSync(`./${rootDbPath}/FUNNY`, { recursive: true })
  if (!fs.existsSync(`./${rootDbPath}/EPIC-COMPILED`)) fs.mkdirSync(`./${rootDbPath}/EPIC-COMPILED`, { recursive: true })
  if (!fs.existsSync(`./${rootDbPath}/FUNNY-COMPILED`)) fs.mkdirSync(`./${rootDbPath}/FUNNY-COMPILED`, { recursive: true })

  const paths = getPathsRecursively(`${rootDbPath}`)
  console.log(paths)
})

test('saveAndGetClipData', async () => {
  if (!fs.existsSync(`./${rootDbPath}}/EPIC`)) fs.mkdirSync(`./${rootDbPath}/EPIC`, { recursive: true })
  if (!fs.existsSync(`./${rootDbPath}/FUNNY`)) fs.mkdirSync(`./${rootDbPath}/FUNNY`, { recursive: true })
  if (!fs.existsSync(`./${rootDbPath}/EPIC-COMPILED`)) fs.mkdirSync(`./${rootDbPath}/EPIC-COMPILED`, { recursive: true })
  if (!fs.existsSync(`./${rootDbPath}/FUNNY-COMPILED`)) fs.mkdirSync(`./${rootDbPath}/FUNNY-COMPILED`, { recursive: true })

  const clipInfo: IClipData = {
    gdClipId: '00000000',
    clipCategory: 'TRASH',
    clipAuthorDiscordId: '123456789',
    clipProvider: 'outplayed',
    clipId: '987654321',
    clipDate: new Date().toJSON()
  }

  const save = saveClipData(clipInfo)
  if (save instanceof Error) throw new Error(`Save Clip Data failed: ${save}`)

  const clipData = getClipData('00000000')
  if (clipData instanceof Error) throw new Error(clipData.message)
  console.log(clipData)
})
