import { checkMaxClipTime, saveDownloadData } from '../functions/common'
import { downloadClip } from '../functions/providers'
// import { createCover } from '../functions/createCover'
// import { createLowerThirdIG } from '../functions/createLowerThirdIG'
// import { discordLogin } from '../functions/discordLogin'
// import { editClipIG } from '../functions/editClipIG'
// import { instagramLogin } from '../functions/instagramLogin'
// import { uploadToIG } from '../functions/uploadToIGClip'

const gdClipId = '972718287370743878'

async function test () {
  // await discordLogin()
  // await instagramLogin()
  const savedDownloadData = await saveDownloadData(gdClipId)
  if (savedDownloadData instanceof Error) return savedDownloadData
  const checkedMaxClipTime = checkMaxClipTime(gdClipId)
  if (checkedMaxClipTime instanceof Error) return checkedMaxClipTime
  const downloaded = await downloadClip(gdClipId)
  if (downloaded instanceof Error) throw downloaded
  // const cover = await createCover(gdClipId, 'KevyX')
  // if (cover instanceof Error) throw cover
  // const ltIG = await createLowerThirdIG(gdClipId, 'KevyX')
  // if (ltIG instanceof Error) throw ltIG
  // const videoEditedIG = await editClipIG(gdClipId)
  // if (videoEditedIG instanceof Error) throw videoEditedIG
  // const uploadedIG = await uploadToIG(gdClipId, 'KevyX')
  // if (uploadedIG instanceof Error) throw uploadedIG
  console.log('Done!')
}
test()
