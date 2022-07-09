const {Markup} = require("telegraf");
const fs = require('fs');
const axios = require('axios');
const sizeOf = require("image-size");
const sharp = require("sharp");

async function saveImage(ctx) {
    let userId = ctx.message.from.id;
    const fileId = ctx.message.document.file_id;
    let fileURL;

    try {
        fileURL = await ctx.telegram.getFileLink(fileId);
    } catch (e) {
        console.log(e);
        ctx.reply('Something went wrong during file downloading from telegram');
        await ctx.scene.leave();
        return;
    }

    const localPath = process.env.LOCAL_PATH;

    let dirPath = `${localPath}/${userId}`;

    await fs.access(dirPath, async error => {
        if (error) {
            await fs.mkdir(dirPath, (err) => {
                if (err) {
                    console.log('Не удалось создать папку'); // не удалось создать папку
                }
                console.log('Папка успешно создана');
            });
        }
    });

    const fileName = ctx.message.document.file_unique_id;

    let filePath = `${localPath}/${userId}/${fileName}.${ctx.session.fileType}`;

    try {
        axios({method: 'get', url: fileURL.href, responseType: 'stream'}).then(async response => {
            await response.data.pipe(fs.createWriteStream(filePath));
        });
    } catch (e) {
        console.log(e);
        ctx.reply('Something went wrong while saving your file. Please, try again');
        await ctx.scene.leave();
        return;
    }

    ctx.session.dirPath = dirPath;
    ctx.session.fullFilePath = filePath;
}

function getImageInfo(ctx) {
    try {
        const dimensions = sizeOf(ctx.session.fullFilePath);
        let stats = fs.statSync(ctx.session.fullFilePath);
        let fileSize = stats.size / 1024;

        return {
            width: dimensions.width,
            height: dimensions.height,
            size: fileSize
        };
    } catch (e) {
        console.log(e);
        ctx.reply('Can\'t get image size');
    }
}

async function changeAndSendImage(ctx, width, height) {
    const output = `${ctx.session.dirPath}/output.${ctx.session.fileType}`
    height = Math.round(height);
    width = Math.round(width);

    try {
        await sharp(ctx.session.fullFilePath).resize(width, height, {fit: sharp.fit.inside}).toFile(output);
    } catch (e) {
        console.log(e);
        ctx.reply('Can\'t get the file. Please, try again');
        await ctx.scene.leave();
        return;
    }


    const dimensions = await sizeOf(output);

    await ctx.replyWithDocument({source: output},
        {caption: `Here\'s your image with resolution ${dimensions.width}x${dimensions.height}`});

    await ctx.replyWithHTML('Do you want to try other resolutions?', Markup.inlineKeyboard([
        [Markup.button.callback('Try more', 'back_to_res'), Markup.button.callback('Go back', 'back_btn')]
    ]));
}

module.exports.saveImage = saveImage
module.exports.getImageInfo = getImageInfo
module.exports.changeAndSendImage = changeAndSendImage
