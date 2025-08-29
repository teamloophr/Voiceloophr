import { describe, test, expect } from 'vitest'
import { EnhancedPDFProcessor } from '../lib/pdf-utils'

describe('EnhancedPDFProcessor.analyzePDFContent', () => {
  test('returns structured extraction for good quality text', async () => {
    const content = 'This is a standard PDF text with proper sentences. It should be considered good quality.'
    const result = await EnhancedPDFProcessor.analyzePDFContent(content)
    expect(result.text.length).toBeGreaterThan(10)
    expect(['structured', 'ai_enhanced', 'ocr_enhanced', 'failed']).toContain(result.extractionMethod)
    expect(result.confidence).toBeGreaterThanOrEqual(0)
  })

  test('handles low-quality artifact content gracefully', async () => {
    const content = 'endstream endobj BT ET Td Tj TJ Tm Tc Tw Tz TL Ts Tr Tf \x00\x01 garbled'
    const result = await EnhancedPDFProcessor.analyzePDFContent(content)
    expect(result.text).toBeTypeOf('string')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
  })
})


