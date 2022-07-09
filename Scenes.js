const {Scenes, Markup} = require('telegraf');
const utils = require('./utilities');
const consts = require('./constants');

class ScenesContainer {
    saveImgScene() {
        const imageSave = new Scenes.BaseScene('imageSave');

        imageSave.enter((ctx) => {
            ctx.reply(`Send me an image`);
        });

        imageSave.on("photo", (ctx) => {
            ctx.reply(`Please, send image without compression. For more info use /help`);
        });

        imageSave.on('document', async (ctx) => {
            const format = ctx.message.document.mime_type;
            ctx.session.fileType = format.slice(format.indexOf('/') + 1);

            if(consts.formats.includes(ctx.session.fileType))
            {
                await utils.saveImage(ctx);
                setTimeout(async function() {
                    const info = utils.getImageInfo(ctx);

                    if(info !== undefined) {
                        await ctx.reply(`Parameters of sent image:\n width - ${info.width},\n height - ${info.height},\n size - ${Math.round(info.size)}Kbs`);
                    }

                   ctx.scene.enter('imageRes');
                }, 2000);
            } else {
                ctx.reply(`Incorrect format of file. Try ${consts.formats}`)
            }
        });

        imageSave.on('message', (ctx) => {
            ctx.replyWithHTML(`This isn\'t an image. Wanna go back?`, Markup.inlineKeyboard([
                [Markup.button.callback('Go back', 'back_btn')]
            ]));
        });

        return imageSave;
    }

    resizeImgScene() {
        const imageRes = new Scenes.BaseScene('imageRes');

        imageRes.enter(async (ctx) => {
            await ctx.replyWithHTML(`What do you want to do with resolution?`, Markup.inlineKeyboard(
                [
                    [Markup.button.callback('720x480', 'btn_temp_1'), Markup.button.callback('1280x720', 'btn_temp_2'),
                        Markup.button.callback('1366x768', 'btn_temp_3'), Markup.button.callback('1600x900', 'btn_temp_4')],
                    [Markup.button.callback('1920x1080', 'btn_temp_5'), Markup.button.callback('2560x1440', 'btn_temp_6'),
                        Markup.button.callback('2560x1600', 'btn_temp_7'), Markup.button.callback('3840x2160', 'btn_temp_8')],

                    [Markup.button.callback('Increase by multiplier', 'btn_inc'), Markup.button.callback('Decrease by multiplier', 'btn_dec')],

                    [Markup.button.callback('Set your own value', 'btn_user')],
                    [Markup.button.callback('Go Back', 'back_btn')]
                ]
            ));
        });

        imageRes.on('message', (ctx) => {
            ctx.reply('Use buttons, please');
        })

        return imageRes;
    }

    resizeByUserdataScene() {
        const imageUserRes = new Scenes.BaseScene('imageUserRes');

        imageUserRes.enter(async (ctx) => {
            await ctx.replyWithHTML('Send me width and height in format like 1920x1080 (width x height)', Markup.inlineKeyboard([
                [Markup.button.callback('Go back', 'back_to_res')]
            ]));
        });

        imageUserRes.on('text', async (ctx) => {
            const message = ctx.message.text;

            if(/\dx\d{1,5}/.test(message)) {
                const index = message.indexOf('x');
                const width = Number(message.slice(0, index));
                const height = Number(message.slice(index + 1));

                if((width > 15360) || (height > 8640)) {
                    ctx.reply('The max possible resolution is 15360x8640');
                } else {
                    await utils.changeAndSendImage(ctx, width, height);
                    ctx.scene.leave();
                }
            } else {
                await ctx.reply('Incorrect format');
            }
        });

        imageUserRes.on('message', async (ctx) => {
            ctx.reply('Incorrect format');
        });

        return imageUserRes;
    }
}

module.exports = ScenesContainer
