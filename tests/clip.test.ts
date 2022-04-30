import { editClip } from '../functions/editClip'

test('downloadVideo', async () => {
  const edited = editClip('969359456930517042', undefined, 'KevyX')
  if (edited instanceof Error) return new Error(edited.message)
  expect(edited).toBe(true)
})
