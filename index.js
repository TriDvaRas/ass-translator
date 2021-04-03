const translate = require("translate");
const fs = require(`fs`)
translate.engine = "libre";

MINUTES_MAX = 1
TARGET_LANGUAGE= `ru`


async function main() {
    let file = fs.readFileSync(`./input/Inp.ass`, 'utf8')
    let lines = file.split(`\n`)
    let newLines = []
    let isMeta = true
    let textPos = -1
    for (const line of lines) {
        if (isMeta) {
            newLines.push(line)
            if (line.startsWith(`[Script Info]`))
                newLines.push(`; Text Butchered by TriDvaRas' script `)
            else if (line.startsWith(`[Events]`))
                isMeta = false
        }
        else {
            if (line.startsWith(`Format:`)) {
                newLines.push(line)
                textPos = line.split(/, ?/).indexOf(`Text\r`)
                break
            }
            if (line.includes(`0:02:26.00`)) {
                break
            }
        }
    }
    let dialLines = lines.filter(x => x.startsWith(`Dialogue:`))
    let linesPerRequest = Math.ceil(dialLines.length / (20*MINUTES_MAX))
    let tempLines = []
    for (const line of dialLines) {
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
    let fulllinecount = 0
    let linecount = 0
    let translationBuffer = ``
    let reqNum = 1
    let starttime = Date.now()
    console.log(`Starting translation. Planned to finish in ${MINUTES_MAX * 20} requests with ${linesPerRequest} lines each`);
    for (const line of tempLines) {
        fulllinecount++
        linecount++
        translationBuffer += `${line.text}\n`
        if (linecount == linesPerRequest) {
            console.log(`Starting req ${reqNum}`);
            let translated = await translate(translationBuffer, { to: "ru" });
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
        console.log(`Starting req ${reqNum}`);
        let translated = await translate(translationBuffer, { to: TARGET_LANGUAGE });
        for (let i = 0; i < translated.split(`\n`).length; i++) {
            const res = translated.split(`\n`)[i];
            if (tempLines[linesPerRequest * (reqNum - 1) + i])
                tempLines[linesPerRequest * (reqNum - 1) + i].text = res
            else
                console.log(`Extra line: ${res}`);
        }
        console.log(`Finished req ${reqNum} ${translationBuffer.split(`\n`).length}=>${translated.split(`\n`).length} in ${(Date.now() - starttime) / 1000}s`);

        reqNum++
        linecount = 0
        translationBuffer = ``
    }
    for (const line of tempLines) {
        try {
            let newLine = line.start || dialLines[lines.indexOf(line)].split(`,`).slice(0, textPos)
            newLine.push(`${line.posTag}${line.text.replace(/\/N/g, `\\N`)}`)
            newLines.push(newLine.join(`,`))

        }
        catch (err) {
            console.log(line);
            console.log(err);
        }
    }
    //console.log(tempLines.slice(80,100));
    fs.writeFileSync(`./output/Out.ass`, newLines.join(`\n`))
    console.log(`Done in ${(Date.now() - starttime) / 1000}s`);
}

main()