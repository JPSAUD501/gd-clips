import { getClipData, getPathsRecursively } from '../functions/common'
import { rootDbPath } from '../constants'

test('getPathsRecursively', async () => {
  const paths = getPathsRecursively(`${rootDbPath}`)
  console.log(paths)
})

test('getClipData', async () => {
  const clipData = getClipData('3423423432')
  if (clipData instanceof Error) return console.log(clipData)
  console.log(clipData)
})
