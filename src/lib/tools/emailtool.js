import sgMail from "@sendgrid/mail";
import { getPDFReadableStream } from "./pdf-tools.js";
sgMail.setApiKey(process.env.SEND_GRID_KEY);

export const sendsRegistrationEmail = async (recipientAdress) => {
  try {
    const msg = {
      to: recipientAdress,
      from: process.env.SENDER_EMAIL_ADRESS,
      subject: "Thank you for your interest!",
      html: `
      <html>
      <head>
        <title></title>
      </head>
      <body>
        <div data-role="module-unsubscribe" class="module" role="module" data-type="unsubscribe" style="color:#444444; font-size:15px; line-height:20px; padding:16px 16px 16px 16px; text-align:Center; margin-inline: 50px;" data-muid="4e838cf3-9892-4a6d-94d6-170e474d21e5">
          <div class="Unsubscribe--addressLine">
        <h1 style="line-height: 30px">Thank you for your interest in web development</h1>
        <p>Dear <strong>${recipientAdress},</p></strong>
        <p>I wanted to take a moment to thank you for your interest in web development and for subscribing to our newsletter. We appreciate your support and look forward to sharing valuable information with you on a regular basis.</p>
        <p>Our newsletter will cover a wide range of topics related to web development, including tutorials, tips, and tricks for using various web technologies effectively, as well as news and updates on trends in the industry. We'll also be sharing articles and resources on topics such as web design, user experience, and web accessibility.</p>
        <p>If you have any questions or feedback, please don't hesitate to reach out to us. We love hearing from our subscribers and are always happy to help in any way we can.</p>
        <p>Thank you again for your interest in web development and for subscribing to our newsletter. We look forward to staying in touch.</p>
        <br>

        <img src="https://res.cloudinary.com/dvagn6szo/image/upload/v1678204932/articles/posts/kutnynk3yubp42samdpw.jpg" alt="Web Development Image">
        <p>Best regards</p>
        <p>${process.env.SENDER_EMAIL_ADRESS}</p>
        </div>
          </div>
          <p style="font-size:12px; line-height:20px;">
            <a class="Unsubscribe--unsubscribeLink" href="{{{unsubscribe}}}" target="_blank" style="font-family:sans-serif;text-decoration:none;">
              Unsubscribe
            </a>
            -
            <a href="{{{unsubscribe_preferences}}}" target="_blank" class="Unsubscribe--unsubscribePreferences" style="font-family:sans-serif;text-decoration:none;">
              Unsubscribe Preferences
            </a>
          </p>
        </div>
      </body>
    </html>`,
    };
    await sgMail.send(msg);
    console.log("email sent");
  } catch (error) {
    console.log(error);
  }
};

export const sendsPostNoticationEmail = async (article) => {
  try {
    let pdfStream = await getPDFReadableStream(article);
    // const pdfBuffer = fs.readFileSync(pdfStream, { encoding: "base64" });

    const chunks = [];
    pdfStream.on("data", (chunk) => chunks.push(chunk));
    await new Promise((resolve, reject) => {
      pdfStream.on("end", () => resolve());
      pdfStream.on("error", (err) => reject(err));
    });
    const pdfBuffer = Buffer.concat(chunks);
    const pdfBase64 = pdfBuffer.toString("base64");

    const msg = {
      to: article.author.email,
      from: process.env.SENDER_EMAIL_ADRESS,
      subject: "Copy of your POST!",
      html: `<h1>Here is email copy of your post!</h1>
                <p>Cattegory: ${article.category}</p>
                <p>Title: ${article.title}</p>
                <p>Cover img: ${article.cover}</p>
                <p>Reading time: ${article.readTime.value} ${article.readTime.unit}</p>
                <p>Authors name: ${article.author.name}</p>
                <p>Authors avatar": ${article.author.avatar}</p>
                <p>ID of the post: ${article.id}</p>
                <p>Time of Creation: ${article.createdAt}</p>
                <p>Time of last Update": ${article.updatedAt}</p>
                <br>
                <p>Best regards!</p>
            `,
      attachments: [
        {
          content: pdfBase64,
          filename: "some-attachment.pdf",
          type: "aplication/pdf",
          disposition: "attachment",
          content_id: "mytext",
        },
      ],
    };
    await sgMail.send(msg);
    console.log("email sent");
  } catch (error) {
    console.log(error);
  }
};
