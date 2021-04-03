const translate = require("translate");
const fs = require(`fs`);
const { start } = require("repl");
translate.engine = "libre";
// translate.engine = "google";
// translate.key = "GOOGLE-API-KEY";

REQUESTS_PER_MIN = translate.engine == "libre" ? 20 : 10000

INPUT_FILE = `./input/in.ass`
OUTPUT_FILE = `./output/Out %langpath% .ass`
MINUTES_MAX = 1 //does't account for translation engine speed
BASE_LANG = `ru`
EXTRA_LANGS = [`it`, `hi`]
TARGET_LANG = `ru`

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

function writeFile(path, data, iterator) {
    filename=path.replace(`.ass`,`${iterator}.ass`)
    fs.writeFile(filename,data, { flag: "wx" }, function (err) {
        if (err) {
            console.log("file " + filename + " already exists, testing next");
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
    let linesPerRequest = Math.ceil(dialogueLines.length / (REQUESTS_PER_MIN * MINUTES_MAX))
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

        let linecount = 0
        let translationBuffer = ``
        let reqNum = 1
        let minute = Math.floor(Date.now() / 60000)
        let requestsThisMin = 0
        console.log(`Starting translation (${fromLang}=>${toLang}). Planned to finish in ${MINUTES_MAX * REQUESTS_PER_MIN} requests with ${linesPerRequest} lines each`);
        for (const line of tempLines) {
            linecount++
            translationBuffer += `${line.text}\n`
            if (linecount == linesPerRequest) {
                if (minute == Math.floor(Date.now() / 60000)) {
                    if (requestsThisMin >= REQUESTS_PER_MIN) {
                        console.log(`${requestsThisMin} >= ${REQUESTS_PER_MIN}`);
                        while (minute == Math.floor(Date.now() / 60000))
                            console.log(`Requesting too fast waiting 1s ${minute} == ${Math.floor(Date.now() / 60000)} ${await delay(1000)}`)
                        requestsThisMin = 0
                    }
                    requestsThisMin++
                }
                else {
                    minute = Math.floor(Date.now() / 60000)
                    requestsThisMin = 1
                }
                console.log(`Starting req ${reqNum}`);
                let translated
                while (!translated)
                    try {
                        translated = await translate(translationBuffer, { from: fromLang, to: toLang });
                    } catch (error) {
                        if (error?.message.includes(`Slowdown:`)) {
                            console.log(`Hit limit waiting 20s`);
                            await delay(10000)
                        }
                        else
                            throw error
                    }
                for (let i = 0; i < translated.split(`\n`).length; i++) {
                    const res = translated.split(`\n`)[i];
                    tempLines[linesPerRequest * (reqNum - 1) + i].text = res
                }
                console.log(`Finished req ${reqNum} ${translationBuffer.split(`\n`).length}=>${translated.split(`\n`).length} in ${(Date.now() - starttime) / 1000}s`);

                reqNum++
                linecount = 0
                translationBuffer = ``
            }

        }
        if (linecount > 0) {
            if (minute == Math.floor(Date.now() / 60000)) {
                if (requestsThisMin >= REQUESTS_PER_MIN) {
                    console.log(`${requestsThisMin} >= ${REQUESTS_PER_MIN}`);
                    while (minute == Math.floor(Date.now() / 60000)) {
                        await delay(5000)
                        console.log(`Requesting too fast waiting 5s`)
                    }
                    await delay(5000)
                    requestsThisMin = 0
                }
                requestsThisMin++
            }
            else {
                minute = Math.floor(Date.now() / 60000)
                requestsThisMin = 1
            }
            console.log(`Starting req ${reqNum}`);
            let translated = await translate(translationBuffer, { to: TARGET_LANG });
            for (let i = 0; i < translated.split(`\n`).length; i++) {
                const res = translated.split(`\n`)[i];
                if (tempLines[linesPerRequest * (reqNum - 1) + i])
                    tempLines[linesPerRequest * (reqNum - 1) + i].text = res
                else
                    console.log(`Extra line: ${res}`);
            }
            console.log(`Finished req ${reqNum} ${translationBuffer.split(`\n`).length}=>${translated.split(`\n`).length} in ${(Date.now() - starttime) / 1000}s`);
        }

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