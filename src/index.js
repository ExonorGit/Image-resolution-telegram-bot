const { Telegraf, Markup, Scenes, session } = require('telegraf');
require('dotenv').config();
const consts = require('./constants');
const utils = require('./utilities');

const bot = new Telegraf(process.env.TOKEN);

const ScenesContainer = require('./Scenes');

const scenesHandler = new ScenesContainer();
const imgSaveScene = scenesHandler.saveImgScene();
const imgResScene = scenesHandler.resizeImgScene();
const imageUserResScene = scenesHandler.resizeByUserdataScene();

bot.use(Telegraf.log());

const stage = new Scenes.Stage([imgSaveScene, imgResScene, imageUserResScene]);

bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => ctx.reply(`Hello, ${ctx.message.from.first_name 
        ? ctx.message.from.first_name : 'there'}! Use /commands to see this bot capabilities`));

bot.hears('Start', (ctx) => ctx.reply(`Hello, ${ctx.message.from.first_name
    ? ctx.message.from.first_name : 'there'}! Use /commands to see this bot capabilities`));

bot.help((ctx) => ctx.replyWithHTML(consts.helpText, {
    disable_web_page_preview: true
}));

bot.command('change_img_resolution', (ctx) => {
    ctx.scene.enter('imageSave');
});

bot.command('commands', (ctx) => ctx.reply(consts.commands));

function makeTempResolution(name, width, height) {
    bot.action(name, async (ctx) => {
        await ctx.answerCbQuery()
        await ctx.deleteMessage()

        await utils.changeAndSendImage(ctx, width, height);
    })
}

function showMultipliers(name, text, flag) {
    bot.action(name, async (ctx) => {
        await ctx.answerCbQuery();
        ctx.session.multFlag = flag;

        await ctx.editMessageText(text, Markup.inlineKeyboard([[
            Markup.button.callback('1.5x', 'btn_m1'), Markup.button.callback('2x', 'btn_m2'),
            Markup.button.callback('3x', 'btn_m3'), Markup.button.callback('4x', 'btn_m4')],
            [Markup.button.callback('Go back', 'back_to_res')]
        ]));
    })
}

function changeByMultiplier(name, mult) {
    bot.action(name, async (ctx) => {
        ctx.answerCbQuery();
        ctx.deleteMessage();

        const dimensions = utils.getImageInfo(ctx);
        let height, width;

        if(ctx.session.multFlag) {
            width = dimensions.width * mult;
            height = dimensions.height * mult;
        } else {
            width = dimensions.width / mult;
            height = dimensions.height / mult;
        }

        if((width > 15360) || (height > 8640)) {
            await ctx.reply('The max possible resolution is 15360x8640');
            ctx.scene.enter('imageRes');
        } else {
            await utils.changeAndSendImage(ctx, width, height);
        }
    })
}

bot.action('btn_user', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    ctx.scene.enter('imageUserRes');
})

bot.action('back_btn', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    ctx.scene.leave();
    ctx.reply(consts.commands);
})

bot.action('back_to_res', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    ctx.scene.enter('imageRes');
})

makeTempResolution('btn_temp_1', 720, 480);
makeTempResolution('btn_temp_2', 1280, 720);
makeTempResolution('btn_temp_3', 1366, 768);
makeTempResolution('btn_temp_4', 1600, 900);
makeTempResolution('btn_temp_5', 1920, 1080);
makeTempResolution('btn_temp_6', 2560, 1440);
makeTempResolution('btn_temp_7', 2560, 1600);
makeTempResolution('btn_temp_8', 3840, 2160);

showMultipliers('btn_inc', 'Increase by multiplier:', true);
showMultipliers('btn_dec', 'Decrease by multiplier:', false);

changeByMultiplier('btn_m1', 1.5);
changeByMultiplier('btn_m2', 2);
changeByMultiplier('btn_m3', 3);
changeByMultiplier('btn_m4', 4);

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
