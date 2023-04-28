import {Telegraf, session} from 'telegraf'
import config from 'config'
import {message} from 'telegraf/filters'
import { ogg } from './ogg.js'
import {openai} from './openai.js'
import { code } from 'telegraf/format'


const INITIAL_SESSION = {
    messages: [],
}

// Создаем бота
const bot = new Telegraf(config.get("TELEGRAM_TOKEN"))

// Для сохранения контекста
bot.use(session())

// Запускаем бота
bot.launch()



// Обрабатываем команды
bot.command('start', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Жду ваших команд хозяин...');
})
bot.command('new', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Жду ваших команд хозяин...');
})



// Обрабатываем входные данные(text,voice)
bot.on(message('voice'), async (ctx)=>{
    try {
        
        ctx.session ??= INITIAL_SESSION


        // Получаем ссылку на голосовое сообщение
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)

        // Получаем юзера
        const userId = String(ctx.message.from.id)

        // Сохраняем наш ogg файл
        const oggPath = await ogg.create(link.href, userId)


        // Конвертируем в mp3
        const mp3Path = await ogg.toMp3(oggPath, userId)


        // Конвертируем mp3  в текст
        const text = await openai.transcription(mp3Path)
        await ctx.reply(code(`Ваш запрос хозяин: ${text}`))

        // Ответ
        ctx.session.messages.push({role: openai.roles.USER, content: text})
        const response = await openai.chat(ctx.session.messages)
        ctx.session.messages.push({ role: openai.roles.ASSISTANT, content: response.content })

        await ctx.reply(response.content)

    } catch (e) {
        console.log('Ошибка голосового сообщения');
    }
})

bot.on(message('text'), async (ctx) => {
    try {

        ctx.session ??= INITIAL_SESSION


        // Ответ
        ctx.session.messages.push({ role: openai.roles.USER, content: ctx.message.text })
        const response = await openai.chat(ctx.session.messages)
        ctx.session.messages.push({ role: openai.roles.ASSISTANT, content: response.content })

        await ctx.reply(response.content)

    } catch (e) {
        console.log('Ошибка голосового сообщения');
    }
})


// Если Node.js завершает работу
process.once('SIGINT', ()=>{
    bot.stop('SIGINT')
})
process.once('SIGTERM', () => {
    bot.stop('SIGTERM')
})

