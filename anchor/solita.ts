const PROGRAM_NAME = "zklsol";
const PROGRAM_ID = "4BEBe7TVDef5Nfdft252mMCSNBBmPLQ2gVXmKvJvSbP1";

const path = require("path");
const programDir = path.join(__dirname, "programs", "zklsol");
const generatedIdlDir = path.join(__dirname, "target", "idl");
const generatedSDKDir = path.join(__dirname, "solita");
const {spawn} = require("child_process");
const {Solita} = require("@metaplex-foundation/solita");
const {writeFile} = require("fs/promises");

// @ts-ignore
const anchor = spawn("anchor", ["build", "--idl", generatedIdlDir], {
    cwd: programDir,
})
    .on("error", (err) => {
        console.error(err);
        // @ts-ignore this err does have a code
        if (err.code === "ENOENT") {
            console.error(
                "Ensure that `anchor` is installed and in your path, see:\n  https://project-serum.github.io/anchor/getting-started/installation.html#install-anchor\n",
            );
        }
        process.exit(1);
    })
    .on("exit", () => {
        console.log(
            "IDL written to: %s",
            path.join(generatedIdlDir, `${PROGRAM_NAME}.json`),
        );
        generateTypeScriptSDK();
    });

anchor.stdout.on("data", (buf) => console.log(buf.toString("utf8")));
anchor.stderr.on("data", (buf) => console.error(buf.toString("utf8")));

async function generateTypeScriptSDK() {
    console.error("Generating TypeScript SDK to %s", generatedSDKDir);
    const generatedIdlPath = path.join(generatedIdlDir, `${PROGRAM_NAME}.json`);

    const idl = require(generatedIdlPath);
    if (idl.metadata?.address == null) {
        idl.metadata = {...idl.metadata, address: PROGRAM_ID};
        await writeFile(generatedIdlPath, JSON.stringify(idl, null, 2));
    }
    const gen = new Solita(idl, {formatCode: true});
    await gen.renderAndWriteTo(generatedSDKDir);

    console.error("Success!");

    process.exit(0);
}
