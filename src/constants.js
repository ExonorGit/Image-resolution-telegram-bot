const commands = `
/start - Restart bot
/commands - View bot commands
/help - Get the guide about bot usage
/change_img_resolution - Change image resolution
`;

const formats = 'jpeg, png, webp, avif or tiff';

const helpText = `
By this bot you can easily change resolution of your images.

Bot supports the following formats: <b>${formats}</b>.

Also, It is necessary for you to send images <i>without compression</i>. If you don't know hot to do It, check this <a href="https://www.makeuseof.com/send-uncompressed-photos-videos-telegram/">link</a>

If you send a vertical image, It would be impossible to reach most of the resolution templates, but I'll anyway try to maximize the resolution 

Note: max resolution of output file is <b>15360x8640</b> (16K).
`;

module.exports.commands = commands
module.exports.formats = formats
module.exports.helpText = helpText
