const NodeID3 = require('node-id3')
const crypto = require('crypto')
const {FileBox} = require("file-box");


async function update() {
    // const musicSrc = "E:\\Boot-Root-Dir\\网易云下载\\菊花夜行军\\交工乐队\\交工乐队 - 日久他乡是故乡.mp3"
    const musicSrc = "E:\\CloudMusic\\郁冬 - 我心中的你.mp3"
    // const filebox = FileBox.fromFile(musicSrc)
    // const buffer = await filebox.toBuffer()
    // const tags = {
    //     title: "Tomorrow",
    //     artist: "Kevin Penkin",
    //     album: "TVアニメ「メイドインアビス」オリジナルサウンドトラック",
    //     APIC: "./example/mia_cover.jpg",
    //     TRCK: "27"
    // }
    const success = NodeID3.read(musicSrc,{}) // Returns true/Error
    console.log(success)
    decode_163(success.comment.text)
}
// update()


const mm = require('music-metadata');

// 你的音乐文件路径
const filePath = "E:\\CloudMusic\\郁冬 - 我心中的你.mp3"

// 读取音乐文件的元数据
mm.parseFile(filePath)
    .then(metadata => {
        // 从元数据中获取歌词信息（这是一个简单的示例，实际情况可能因文件类型和元数据不同而有所不同）
        const lyrics = metadata.common.lyrics;
        if (lyrics) {
            console.log('歌词信息：', lyrics);

            // 在这里可以对歌词信息进行修改

            // 将修改后的歌词信息写回元数据
            // 这个部分将因具体库而异，具体操作请查看库的文档
        } else {
            console.log('该音乐文件不包含歌词信息。');
        }
    })
    .catch(err => {
        console.error('读取元数据时出错：', err.message);
    });
// const filePath = "E:\\CloudMusic\\肖容 - 我说我不来(单曲).mp3"
// const tags = NodeID3.read(filePath)
// console.log(tags)
//
function decode_163(comment) {
    const key = comment.substring(22); // 移除 163 key(Don't modify):
    const aes128ecbDecipher = crypto.createDecipheriv('aes-128-ecb', '#14ljk_!\\]&0U<\'(', '');
    const raw = aes128ecbDecipher.update(key, 'base64') + aes128ecbDecipher.final(); // Base64 解码，AES 解密
    const json = JSON.parse(raw.substring(6)); // 移除 music: 并解析 JSON
    console.log(json)
}
