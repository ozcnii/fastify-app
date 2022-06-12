import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "testAccount.user", // generated ethereal user
    pass: "testAccount.pass", // generated ethereal password
  },
});

export const MailService = {
  restorePassword: async (to: string, restoreCode: string) => {
    await transporter.sendMail({
      from: '"Fred Foo 👻" <foo@example.com>', // sender address
      to, //: "bar@example.com, baz@example.com", // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: `<b>Hello world?</b> <br/> Code: ${restoreCode}`, // html body
    });
  },
};
