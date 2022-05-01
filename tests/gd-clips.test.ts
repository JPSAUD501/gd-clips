import { createThumbnail } from '../functions/createThumbnail'

function test () {
  const createdThumbnail = createThumbnail('969841601029480498', 'Erol')
  if (createdThumbnail instanceof Error) return new Error(createdThumbnail.message)
}
test()
