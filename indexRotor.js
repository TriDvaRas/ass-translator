const fs = require(`fs`);
var randomColor = require('randomcolor');

SETTINGS = {
    f: true,
    bord: true,
    shad: true,
    be: true,
    fn: true,
    fs: true,
    fsp: true,
    c: true,
    an: true,
    move: true,
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const rand = (a, b) => a + Math.random() * (b - a)
const randInt = (a, b) => Math.floor(a + Math.random() * (b - a))
const rand360 = (a) => (360 + rand(-1, 1) * a) % 360

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
    for (const filename of fs.readdirSync(`./input`)) {
        console.log(`Starting ${filename}`);
        INPUT_FILE = `./input/${filename}`
        OUTPUT_FILE = `./output/[R]${filename}`


        let file = fs.readFileSync(INPUT_FILE, 'utf8')
        let lines = file.split(`\n`)
        let newLines = []
        let isMeta = true
        let textPos = -1
        let ResX = 640
        let ResY = 360
        for (const line of lines) {
            if (isMeta) {
                newLines.push(line)
                if (line.includes(`[Script Info]`))
                    newLines.push(`; Text Butchered by https://github.com/TriDvaRas/ass-translator\n; `)
                else if (line.includes(`[Events]`))
                    isMeta = false
                else if (line.includes(`PlayResX:`))
                    ResX = parseInt(line.slice(9))
                else if (line.includes(`PlayResY:`))
                    ResY = parseInt(line.slice(9))
                else if (line.includes(`Video File:`)) {
                    OUTPUT_FILE = `./output/[R]${line.replace(/Video File: ?/, ``).split(`/`).slice(-1)[0].split(`.`).slice(0, -1).join(`.`)}.ass`
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

        let rots = [0, 0, 0, 0, 0]
        let bords = [0, 0, 0]
        let shads = [0, 0, 0]
        let bes = [0, 0]
        let fns = [0, 0, 0, 0]
        let fss = [0, 0, 0, 0]
        let fsps = [0, 0]
        let cs = [0, 0, 0]
        let ans = [0]
        let moves = [0, 0]
        for (const line of tempLines) {
            if (SETTINGS.f) {
                let r = Math.random()
                if (r < 0.01) {
                    line.text = `{\\frz${rand360(180)}\\frx${rand360(180)}\\fry${rand360(180)}}${line.text}`
                    rots[0]++
                }
                else if (r < 0.05) {
                    line.text = `{\\frz${rand360(8)}\\frx${rand360(56)}\\fry${rand360(10)}}${line.text}`
                    rots[1]++
                }
                else if (r < 0.20) {
                    line.text = `{\\frz${rand360(6)}\\fry${rand360(10)}}${line.text}`
                    rots[2]++
                }
                else if (r < 0.25) {
                    line.text = `{\\frz${rand360(6)}\\frx${rand360(56)}}${line.text}`
                    rots[3]++
                }
                else if (r < 0.35) {
                    line.text = `{\\frz${rand360(6)}}${line.text}`
                    rots[4]++
                }
            }
            if (SETTINGS.bord) {
                let r = Math.random()

                if (r < 0.01) {
                    line.text = `{\\bord${rand(0, 150)}}${line.text}`
                    bords[0]++
                }
                else if (r < 0.05) {
                    line.text = `{\\bord${rand(0, 50)}}${line.text}`
                    bords[1]++
                }
                else if (r < 0.20) {
                    line.text = `{\\bord${rand(0, 20)}}${line.text}`
                    bords[2]++
                }
            }
            if (SETTINGS.shad) {
                let r = Math.random()
                if (r < 0.01) {
                    line.text = `{\\shad${rand(80, 120)}}${line.text}`
                    shads[0]++
                }
                else if (r < 0.05) {
                    line.text = `{\\shad${rand(40, 90)}}${line.text}`
                    shads[1]++
                }
                else if (r < 0.20) {
                    line.text = `{\\shad${rand(10, 30)}}${line.text}`
                    shads[2]++
                }
            }
            if (SETTINGS.be) {
                let r = Math.random()
                if (r < 0.01) {
                    line.text = `{\\be${rand(0, 10)}}${line.text}`
                    bes[0]++
                }
                else if (r < 0.35) {
                    line.text = `{\\be${rand(40, 90)}}${line.text}`
                    bes[1]++
                }
            }
            if (SETTINGS.fn) {
                let r = Math.random()
                if (r < 0.01) {
                    line.text = `{\\fnJavanese Text}${line.text}`
                    fns[0]++
                }
                else if (r < 0.02) {
                    line.text = `{\\fnWebdings}${line.text}`
                    fns[1]++
                }
                else if (r < 0.11) {
                    line.text = `{\\fnTimes New Roman${rand(40, 90)}}${line.text}`
                    fns[2]++
                }
                else if (r < 0.20) {
                    line.text = `{\\fnImpact${rand(40, 90)}}${line.text}`
                    fns[3]++
                }
            }
            if (SETTINGS.fs) {
                let r = Math.random()
                if (r < 0.01) {
                    line.text = `{\\fs${randInt(12, 256)}}${line.text}`
                    fss[0]++
                }
                else if (r < 0.04) {
                    line.text = `{\\fs${randInt(18, 120)}}${line.text}`
                    fss[1]++
                }
                else if (r < 0.12) {
                    line.text = `{\\fs${randInt(45, 95)}}${line.text}`
                    fss[2]++
                }
                else if (r < 0.19) {
                    line.text = `{\\fs${randInt(55, 80)}}${line.text}`
                    fss[3]++
                }
            }
            if (SETTINGS.fsp) {
                let r = Math.random()
                if (r < 0.005) {
                    line.text = `{\\fsp${rand(100, 512)}}${line.text}`
                    fsps[0]++
                }
                else if (r < 0.05) {
                    line.text = `{\\fsp${rand(-10, 25)}}${line.text}`
                    fsps[1]++
                }
            }
            if (SETTINGS.c) {
                let r = Math.random()
                if (r < 0.05) {
                    line.text = `{\\1c${randomColor({ luminosity: 'light' })}\\2c${randomColor({ luminosity: 'dark' })}}${line.text}`
                    cs[0]++
                }
                else if (r < 0.125) {
                    line.text = `{\\1c${randomColor({ luminosity: 'light' })}}${line.text}`
                    cs[1]++
                }
                else if (r < 0.20) {
                    line.text = `{\\2c${randomColor({ luminosity: 'dark' })}}${line.text}`
                    cs[1]++
                }
            }
            if (SETTINGS.an) {
                let r = Math.random()
                if (r < 0.02) {
                    line.text = `{\\an${randInt(1, 10)}}${line.text}`
                    ans[0]++
                }
            }
            if (SETTINGS.move) {
                let r = Math.random()
                if (r < 0.003) {
                    line.text = `{\\move(${randInt(0, ResX)},${randInt(0, ResY)},${randInt(0, ResX)},${randInt(0, ResY)},${randInt(0, 2000)},${randInt(2000, 4000)}))}${line.text}`
                    moves[0]++
                }
                else if (r < 0.01) {
                    line.text = `{\\move(${randInt(0, ResX)},${randInt(0, ResY)},${randInt(0, ResX)},${randInt(0, ResY)})}${line.text}`
                    moves[1]++
                }
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
        console.log(`Rots:`, rots);
        console.log(`Bords:`, bords);
        console.log(`Shads:`, shads);
        console.log(`Bes:`, bes);
        console.log(`Fns:`, fns);
        console.log(`Fss:`, fss);
        console.log(`Fsps:`, fsps);
        console.log(`Cs:`, cs);
        console.log(`Ans:`, ans);
        console.log(`Moves:`, moves);
        console.log(`Done in ${(Date.now() - starttime) / 1000}s`);
        writeFile(OUTPUT_FILE, newLines.join(`\n`), 0)

    }
}
main()