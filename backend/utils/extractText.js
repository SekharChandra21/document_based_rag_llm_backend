import fs from "fs";
import { PDFParse } from "pdf-parse";

const streamToBuffer = async (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.once("end", () => resolve(Buffer.concat(chunks)));
    stream.once("error", reject);
  });
};

export const extractTextFromPDF = async (source) => {
  let dataBuffer;

  if (Buffer.isBuffer(source)) {
    dataBuffer = source;
  } else if (typeof source === "string" && /^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to download PDF from URL: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    dataBuffer = Buffer.from(arrayBuffer);
  } else if (typeof source === "string") {
    dataBuffer = fs.readFileSync(source);
  } else if (source instanceof ArrayBuffer) {
    dataBuffer = Buffer.from(source);
  } else if (ArrayBuffer.isView(source)) {
    dataBuffer = Buffer.from(source.buffer, source.byteOffset, source.byteLength);
  } else if (source?.buffer && Buffer.isBuffer(source.buffer)) {
    dataBuffer = source.buffer;
  } else if (source?.arrayBuffer && typeof source.arrayBuffer === "function") {
    const arrayBuffer = await source.arrayBuffer();
    dataBuffer = Buffer.from(arrayBuffer);
  } else if (source?.pipe && typeof source.pipe === "function") {
    dataBuffer = await streamToBuffer(source);
  } else {
    const sourceType = source === null ? "null" : typeof source;
    const constructorName = source?.constructor?.name ? ` (${source.constructor.name})` : "";
    throw new Error(`Unsupported PDF source type: ${sourceType}${constructorName}`);
  }

  const pdfParser = new PDFParse({ data: dataBuffer });
  const parsed = await pdfParser.getText();
  return parsed.text;
};