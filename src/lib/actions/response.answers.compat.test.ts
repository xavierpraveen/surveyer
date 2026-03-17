import { describe, expect, test } from 'vitest'
import { mapAnswerValueForStorage } from './response-draft-compat'

describe('mapAnswerValueForStorage', () => {
  test('stores text answers in text_value and uses empty selected_options', () => {
    expect(mapAnswerValueForStorage('hello')).toEqual({
      text_value: 'hello',
      numeric_value: null,
      selected_options: [],
    })
  })

  test('stores numeric answers in numeric_value and uses empty selected_options', () => {
    expect(mapAnswerValueForStorage(5)).toEqual({
      text_value: null,
      numeric_value: 5,
      selected_options: [],
    })
  })

  test('stores array answers in selected_options', () => {
    expect(mapAnswerValueForStorage(['opt1', 'opt2'])).toEqual({
      text_value: null,
      numeric_value: null,
      selected_options: ['opt1', 'opt2'],
    })
  })
})
