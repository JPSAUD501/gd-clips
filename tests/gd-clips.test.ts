import { instagramLogin } from '../functions/clients/instagramLogin'
import { createImgStoriesIG } from '../functions/processes/createImgStoriesIG'
import { uploadImgToStoriesIG } from '../functions/processes/uploadImgToStoriesIG'

async function test () {
  await instagramLogin()
  const createdImg = await createImgStoriesIG('outplayed@kPkXJ1')
  if (createdImg instanceof Error) return console.log(createdImg)
  const postedImgStories = await uploadImgToStoriesIG('outplayed@kPkXJ1')
  if (postedImgStories instanceof Error) return console.log(postedImgStories)
}
test()
