const translate = require("translate");
const cliProgress = require('cli-progress');
const fs = require(`fs`);
translate.engine = "libre";
translate.engines.libre.fetch = ({ url = 'http://localhost:5000/translate', key, from, to, text }) => [
    url, {
        method: "POST",
        body: JSON.stringify({
            q: text,
            source: from,
            target: to,
            api_key: key
        }),
        headers: { "Content-Type": "application/json" }
    }
]

INPUT_FILE = `./input/[ANK-Raws] Love Live! Sunshine!! 01 [BDrip 1920x1080 HEVC FLAC].ass`
OUTPUT_FILE = `./output/Out %langpath%.ass`
BASE_LANG = `en`
EXTRA_LANGS = [`pl`,`ja`,`it`]//
TARGET_LANG = `ru`

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

function writeFile(path, data, iterator) {
    if (iterator > 0)
        filename = path.replace(`.ass`, ` ${iterator}.ass`)
    else
        filename = path
    fs.writeFile(filename, data, { flag: "wx" }, function (err) {
        if (err) {
            //console.log("file " + filename + " already exists, testing next");
            writeFile(path, data, iterator + 1);
        }
        else {
            console.log("Succesfully written " + filename);
        }
    });

}


async function main() {
    let langList = [BASE_LANG, ...EXTRA_LANGS, TARGET_LANG]
    console.log(langList);
    let file = fs.readFileSync(INPUT_FILE, 'utf8')
    let lines = file.split(`\n`)
    let newLines = []
    let isMeta = true
    let textPos = -1
    for (const line of lines) {
        if (isMeta) {
            newLines.push(line)
            if (line.includes(`[Script Info]`))
                newLines.push(`; Text Butchered by https://github.com/TriDvaRas/ass-translator\n; Translation path:${langList.join(`=>`)}`)
            else if (line.includes(`[Events]`))
                isMeta = false
            else if (line.includes(`Video File:`)) {
                OUTPUT_FILE = `./output/${line.replace(/Video File: ?/, ``).split(`/`).slice(-1)[0].split(`.`).slice(0, -1).join(`.`)} %langpath%.ass`
                console.log(`Found filename line. Changed OUTPUT_FILE to ${line.replace(/Video File: ?/, ``).split(`.`).slice(0, -1).join(`.`)}`);
            }
        }
        else {
            if (line.startsWith(`Format:`)) {
                newLines.push(line)
                textPos = line.split(/, ?/).indexOf(`Text\r`)
                break
            }
        }
    }
    let dialogueLines = lines.filter(x => x.startsWith(`Dialogue:`))
    let tempLines = []
    for (const line of dialogueLines) {
        let text = line.split(`,`).slice(textPos).join(`,`)
        let posTag = ``
        if (text.match(/\{(\\pos.*?)\}/)) {
            posTag = text.match(/\{(\\pos.*?)\}/gu)
        }
        text = text.replace(/\{(.*?)\}/gu, ``)
            .replace(/\\N/g, ` \\N `)

        tempLines.push({
            start: line.split(`,`).slice(0, textPos),
            text,
            posTag,
        })
    }

    let starttime = Date.now()

    for (let i = 0; i < langList.length - 1; i++) {
        const fromLang = langList[i];
        const toLang = langList[i + 1];
        const bar = new cliProgress.SingleBar({ format: `${fromLang}=>${toLang} |{bar}| {percentage}% {value}/{total} | {duration}s  \t{lastline}` }, cliProgress.Presets.shades_classic);
        bar.start(tempLines.length, 0);
        //console.log(`Starting translation (${fromLang}=>${toLang})`);
        for (const line of tempLines) {
            let succ = false
            while (!succ) {
                try {
                    line.text = await translate(line.text || ` `, { from: fromLang, to: toLang });
                    await delay(10)
                    succ = true
                } catch (error) {
                    if (`${error}`.includes(`socket hang up`) || `${error}`.includes(`CONN`)) {
                        await delay(1000)
                    }
                    else {
                        line.text = ` `
                        console.log(error);
                    }
                }
            }

            bar.increment(1, {
                lastline: line.text.slice(0, 40)
            })
        }
        bar.stop()
    }
    for (const line of tempLines) {
        try {
            let newLine = line.start || dialogueLines[lines.indexOf(line)].split(`,`).slice(0, textPos)
            newLine.push(`${line.posTag}${line.text.replace(/\/N/g, `\\N`)}`)
            newLines.push(newLine.join(`,`))

        }
        catch (err) {
            console.log(line);
            console.log(err);
        }
    }
    //console.log(tempLines.slice(80,100));
    console.log(`Done in ${(Date.now() - starttime) / 1000}s`);
    writeFile(OUTPUT_FILE.replace(`%langpath%`, langList.join(`-`)), newLines.join(`\n`), 0)
}

main()