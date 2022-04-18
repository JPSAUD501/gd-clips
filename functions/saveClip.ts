import { IClipData } from '../interfaces'
import { saveClipData } from './common'

export function saveClip (clipData: IClipData): void {
  const save = saveClipData(clipData)
  if (save instanceof Error) throw new Error(`Error saving clip data!: ${save}`)
}
