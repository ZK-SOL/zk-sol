import * as fs from "fs"
import process from "process";
// @ts-ignore
import {utils} from "ffjavascript";

const {unstringifyBigInts, leInt2Buff} = utils;

function convert_data(mydata: any) {
    for (const i in mydata) {
        if (i == 'vk_alpha_1') {
            for (const j in mydata[i]) {
                mydata[i][j] = leInt2Buff(unstringifyBigInts(mydata[i][j]), 32).reverse()
            }
        } else if (i == 'vk_beta_2') {
            for (const j in mydata[i]) {
                let tmp = Array.from(leInt2Buff(unstringifyBigInts(mydata[i][j][0]), 32)).concat(Array.from(leInt2Buff(unstringifyBigInts(mydata[i][j][1]), 32))).reverse()
                mydata[i][j][0] = tmp.slice(0, 32)
                mydata[i][j][1] = tmp.slice(32, 64)
            }
        } else if (i == 'vk_gamma_2') {
            for (const j in mydata[i]) {
                let tmp = Array.from(leInt2Buff(unstringifyBigInts(mydata[i][j][0]), 32)).concat(Array.from(leInt2Buff(unstringifyBigInts(mydata[i][j][1]), 32))).reverse()
                mydata[i][j][0] = tmp.slice(0, 32)
                mydata[i][j][1] = tmp.slice(32, 64)
            }
        } else if (i == 'vk_delta_2') {
            for (const j in mydata[i]) {
                let tmp = Array.from(leInt2Buff(unstringifyBigInts(mydata[i][j][0]), 32)).concat(Array.from(leInt2Buff(unstringifyBigInts(mydata[i][j][1]), 32))).reverse()
                mydata[i][j][0] = tmp.slice(0, 32)
                mydata[i][j][1] = tmp.slice(32, 64)
            }
        } else if (i == 'vk_alphabeta_12') {
            for (const j in mydata[i]) {
                for (const z in mydata[i][j]) {
                    for (const u in mydata[i][j][z]) {
                        mydata[i][j][z][u] = leInt2Buff(unstringifyBigInts(mydata[i][j][z][u]))

                    }
                }
            }
        } else if (i == 'IC') {
            for (const j in mydata[i]) {
                for (const z in mydata[i][j]) {
                    mydata[i][j][z] = leInt2Buff(unstringifyBigInts(mydata[i][j][z]), 32).reverse()
                }
            }
        }
    }
}

async function create_output(mydata: any, outputPath: string) {
    let resFile = await fs.openSync(outputPath + "verifying_key.rs", "w")
    let s = `use groth16_solana::groth16::Groth16Verifyingkey;\n\npub const VERIFYINGKEY: Groth16Verifyingkey =  Groth16Verifyingkey {\n\tnr_pubinputs: ${mydata.IC.length},\n\n`
    s += "\tvk_alpha_g1: [\n"
    for (let j = 0; j < mydata.vk_alpha_1.length - 1; j++) {
        s += "\t\t" + Array.from(mydata.vk_alpha_1[j])/*.reverse().toString()*/ + ",\n"
    }
    s += "\t],\n\n"
    fs.writeSync(resFile, s)
    s = "\tvk_beta_g2: [\n"
    for (let j = 0; j < mydata.vk_beta_2.length - 1; j++) {
        for (let z = 0; z < 2; z++) {
            s += "\t\t" + Array.from(mydata.vk_beta_2[j][z])/*.reverse().toString()*/ + ",\n"
        }
    }
    s += "\t],\n\n"
    fs.writeSync(resFile, s)
    s = "\tvk_gamme_g2: [\n"
    for (let j = 0; j < mydata.vk_gamma_2.length - 1; j++) {
        for (let z = 0; z < 2; z++) {
            s += "\t\t" + Array.from(mydata.vk_gamma_2[j][z])/*.reverse().toString()*/ + ",\n"
        }
    }
    s += "\t],\n\n"
    fs.writeSync(resFile, s)

    s = "\tvk_delta_g2: [\n"
    for (let j = 0; j < mydata.vk_delta_2.length - 1; j++) {
        for (let z = 0; z < 2; z++) {
            s += "\t\t" + Array.from(mydata.vk_delta_2[j][z])/*.reverse().toString()*/ + ",\n"
        }
    }
    s += "\t],\n\n"
    fs.writeSync(resFile, s)
    s = "\tvk_ic: &[\n"
    let x = 0;

    for (const ic in mydata.IC) {
        s += "\t\t[\n"
        // console.log(mydata.IC[ic])
        for (let j = 0; j < mydata.IC[ic].length - 1; j++) {
            s += "\t\t\t" + mydata.IC[ic][j]/*.reverse().toString()*/ + ",\n"
        }
        x++;
        s += "\t\t],\n"
    }
    s += "\t]\n};"
    fs.writeSync(resFile, s)
}

async function main() {
    let inputPath = process.argv[2];
    if (!inputPath) {
        throw new Error("inputPath not specified");
    }

    let outputPath = ""
    if (process.argv[3]) {
        outputPath += process.argv[3] + "/";
    }

    const fd = fs.readFileSync(inputPath);
    const mydata = JSON.parse(fd.toString());
    convert_data(mydata);
    await create_output(mydata, outputPath)
}


main().then(() => {
    console.log("Done");
    process.exit(0);
}).catch(error => {
    console.error("Error", error);
    process.exit(1);
})