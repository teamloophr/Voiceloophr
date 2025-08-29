import { EnhancedPDFProcessor } from "../../lib/pdf-utils";
import { expect, test, describe, vi } from "vitest";
import OpenAI from "openai";

// Mock OpenAI API calls
vi.mock("openai", () => {
  return {
    default: vi.fn(() => ({
      chat: {
        completions: {
          create: vi.fn((params) => {
            if (params.messages[0].content.includes("OCR specialist")) {
              // Mock response for OCR processing
              return Promise.resolve({
                choices: [
                  {
                    message: {
                      content: "This is a reconstructed text from a scanned document. It contains HR relevant information like Name: John Doe, Position: Software Engineer, Experience: 5 years. This text should be extracted by OCR.",
                    },
                  },
                ],
              });
            } else if (params.messages[0].content.includes("professional document parser")) {
              // Mock response for AI enhanced extraction
              return Promise.resolve({
                choices: [
                  {
                    message: {
                      content: "This is an AI-enhanced extracted text. It focuses on HR content such as candidate profiles and job descriptions.",
                    },
                  },
                ],
              });
            }
            return Promise.resolve({
              choices: [
                {
                  message: {
                    content: "Mocked AI response for document parsing.",
                  },
                },
              ],
            });
          }),
        },
      },
    })),
  };
});

describe("EnhancedPDFProcessor", () => {
  // Test case for structured content extraction
  test("should extract structured content correctly", async () => {
    const content = `
      Some header
      This is a test document with some structured text.
      It has multiple lines and should be processed.
      Footer information.
    `;
    const result = await EnhancedPDFProcessor.analyzePDFContent(content);
    expect(result.text).toContain("This is a test document");
    expect(result.confidence).toBeGreaterThan(70);
    expect(result.extractionMethod).toBe("structured");
  });

  // Test case for AI-enhanced extraction (simulating low quality text)
  test("should use AI-enhanced extraction for low quality text", async () => {
    const content = `
      endstream
      Some garbled text here with artifacts. BT ET Td Tj
      This is likely a poorly extracted document.
      This content should trigger AI-enhanced extraction.
    `;
    const result = await EnhancedPDFProcessor.analyzePDFContent(content);
    expect(result.text).toContain("AI-enhanced extracted text");
    expect(result.confidence).toBeGreaterThan(50);
    expect(result.extractionMethod).toBe("ai_enhanced");
  });

  // Test case for OCR-enhanced extraction (simulating scanned document)
  test("should use OCR-enhanced extraction for scanned documents", async () => {
    const content = `
      %PDF-1.4
      %âãÏÓ
      1 0 obj
      << /Type /Catalog /Pages 2 0 R >>
      endobj
      stream
      some binary data\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f
      endstream
      This is a scanned image of a resume. John Doe. Software Engineer. This text should be extracted by OCR.
      More content to increase length and artifacts.
      Another line of text.
    `;
    const result = await EnhancedPDFProcessor.analyzePDFContent(content, { enableOCR: true });
    expect(result.text).toContain("This is a reconstructed text from a scanned document. It contains HR relevant information like Name: John Doe, Position: Software Engineer, Experience: 5 years. This text should be extracted by OCR.");
    expect(result.confidence).toBeGreaterThan(50);
    expect(result.extractionMethod).toBe("ocr_enhanced");
  });

  // Test case for basic cleaning fallback
  test("should fall back to basic cleaning for very poor content", async () => {
    const content = `
      %PDF-1.4
      %âãÏÓ
      1 0 obj
      << /Type /Catalog /Pages 2 0 R >>
      endobj
      stream
      some binary data\x00\x01\x02\x03
      endstream
    `;
    const result = await EnhancedPDFProcessor.analyzePDFContent(content);
    expect(result.text).toContain("some binary data");
    expect(result.confidence).toBeLessThan(50);
    expect(result.extractionMethod).toBe("failed");
  });

  // Test case for empty content
  test("should return low confidence for empty content", async () => {
    const content = "";
    const result = await EnhancedPDFProcessor.analyzePDFContent(content);
    expect(result.text).toBe("");
    expect(result.confidence).toBe(0);
    expect(result.extractionMethod).toBe("failed");
  });

  // Test case for error handling during AI calls
  test("should handle errors during AI calls gracefully", async () => {
    vi.mocked(OpenAI).mockImplementationOnce(() => {
      throw new Error("OpenAI API error");
    });

    const content = "This is some content to test AI errors.";
    const result = await EnhancedPDFProcessor.analyzePDFContent(content);
    expect(result.text).toContain("This is some content to test AI errors.");
    expect(result.confidence).toBe(0);
    expect(result.extractionMethod).toBe("failed");
  });
});




