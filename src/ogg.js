import axios from "axios"
import ffmpeg from "fluent-ffmpeg"
import installer from '@ffmpeg-installer/ffmpeg'
import  {createWriteStream} from 'fs'
import {dirname, resolve} from 'path'
import {fileURLToPath} from 'url'
import { removeFile } from "./utils.js"


// Текущая директория
const __dirname = dirname(fileURLToPath(import.meta.url));

class OggConverter
{
    constructor()
    {
        // Настраиваем конвертер
        ffmpeg.setFfmpegPath(installer.path)
    }


    // Конвертируем в mp3
    toMp3(input, output)
    {
        try {
            const outputPath = resolve(dirname(input), `${output}.mp3`)

            return new Promise((resolve, reject) => {
                ffmpeg(input)
                .inputOption('-t 30')
                .output(outputPath)
                .on('end', ()=>{
                    // Удаляем ненужный отформатированный ogg
                    removeFile(input)
                    resolve(outputPath)
                })
                .on('error', err => reject(err.message))
                .run()
            })
        } catch (error) {
            console.log('Ошибка конвертации файла в mp3', error.message);
        }
    }


    // Создаем ogg файл и сохраняем его
    async create(url, filename)
    {

        try {
            const oggPath = resolve(__dirname, '../voices', `${filename}.ogg`)

            const response = await axios({
                method: 'get',
                url,
                responseType: 'stream'
            }) 
            
            return new Promise(resolve => {
                const stream = createWriteStream(oggPath)
                response.data.pipe(stream)
                stream.on('finish', () => resolve(oggPath))
            })            
        } catch (error) {
            console.log('Ошибка создания ogg файла', error.message);
        }
    }
}

export const ogg = new OggConverter()