const mm = require("music-metadata");

async function main() {
    const metadata = await mm.parseFile('E:\\CloudMusic\\VipSongsDownload\\Pink Floyd - Mother.ncm');
    console.log(metadata)
}
main().then(r => {})
