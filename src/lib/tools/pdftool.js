import PdfPrinter from "pdfmake";
import imageToBase64 from "image-to-base64";

export const getPDFReadableStream = async (article) => {
  // Define font files
  const fonts = {
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      italics: "Helvetica-Oblique",
      bolditalics: "Helvetica-BoldOblique",
    },
  };
  const printer = new PdfPrinter(fonts);
  const imageEncoded = await imageToBase64(article.cover);

  const docDefinition = {
    content: [
      {
        style: "tableExample",
        table: {
          body: [
            [
              "Title",
              "Category",
              "Reading time",
              "Author",
              "Image link",
              "Last Updated",
            ],
            [
              article.title,
              article.category,
              `${article.readTime.value} -
              ${article.readTime.unit}`,
              article.author.name,
              article.cover,
              article.createdAt,
            ],
          ],
        },
      },

      {
        image: `data:image/jpeg;base64,${imageEncoded}`,
        width: 200,
      },
    ],

    defaultStyle: {
      font: "Helvetica",
    },
  };

  const pdfReadableStream = printer.createPdfKitDocument(docDefinition, {});
  pdfReadableStream.end();

  return pdfReadableStream;
};
