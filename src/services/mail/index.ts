import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.yandex.ru",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_LOGIN!, // generated ethereal user
    pass: process.env.EMAIL_PASSWORD!, // generated ethereal password
  },
});

export const MailService = {
  restorePassword: async (to: string, restoreCode: string) => {
    await transporter.sendMail({
      from: `"Fred Foo 👻" ${process.env.EMAIL_LOGIN!}`, // sender address
      to, //: "bar@example.com, baz@example.com", // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: `<b>Hello world?</b> <br/> Code: ${restoreCode}`, // html body
    });
  },
};
