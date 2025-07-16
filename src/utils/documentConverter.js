const fs = require('fs').promises;
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const path = require('path');
const pdf2html = require("pdf2html");
/**
 * Convert a document file to HTML
 * @param {string} filePath - Path to the document file
 * @returns {Promise<string>} - HTML content
 */
async function convertToHtml(filePath) {
  const fileExtension = path.extname(filePath).toLowerCase();
  
  try {
    switch (fileExtension) {
      case '.pdf':
        return await convertPdfToHtml(filePath);
      case '.doc':
      case '.docx':
        return await convertDocToHtml(filePath);
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  } catch (error) {
    console.error('Error converting document to HTML:', error);
    throw error;
  }
}

/**
 * Convert a PDF file to HTML
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - HTML content
 */
async function convertPdfToHtml(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);
    // const data = await pdf2html.html(dataBuffer);
    const data = await pdfParse(dataBuffer);
    
    // Convert text to HTML with basic formatting
    const htmlContent = `
      <div class="pdf-content">
        ${data.text
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => `<p>${line}</p>`)
          .join('')}
      </div>
    `;
    
    return htmlContent;
  } catch (error) {
    console.error('Error converting PDF to HTML:', error);
    throw error;
  }
}

/**
 * Convert a DOC/DOCX file to HTML
 * @param {string} filePath - Path to the DOC/DOCX file
 * @returns {Promise<string>} - HTML content
 */
async function convertDocToHtml(filePath) {
  try {
    const result = await mammoth.convertToHtml({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('Error converting DOC/DOCX to HTML:', error);
    throw error;
  }
}

module.exports = {
  convertToHtml
};