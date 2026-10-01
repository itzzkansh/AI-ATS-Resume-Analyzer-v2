import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const extractText = async (file) => {
  if (file.mimetype === "application/pdf") {
    const parser = new PDFParse({ data: file.buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }
  const result = await mammoth.extractRawText({ buffer: file.buffer });
  return result.value;
};
