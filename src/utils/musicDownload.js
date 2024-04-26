const {getCookie} = require('../utils/musicLogin.js')
const {replyMessage} = require('../utils/messageUtils.js')
const {rootDir,updateFileList} = require('../utils/searchUtils.js')
const cloudMusicApi = require("NeteaseCloudMusicApi");
const {FileBox} = require("file-box");
const fs = require("fs");
const NodeID3 = require('node-id3')
const path = require("path");

/**
 *
 * @param keywords 搜索关键词，默认下载第一个
 * @param cookie
 * @param br 码率mp3最多 320000
 */
async function downloadMusic(keywords,message,cookie,br = 128000) {
    const res = await cloudMusicApi.search({keywords,type:1,cookie})
    const albumId = res.body.result.songs[0].album.id
    const album = await cloudMusicApi.album({cookie,id:albumId})
    const musicId = res.body.result.songs[0].id
    const coverImg = album.body.album.picUrl
    const albumName = album.body.album.name
    const artName = res.body.result.songs[0].artists[0].name
    const musicName = res.body.result.songs[0].name
    const saveName = artName + ' - ' + res.body.result.songs[0].name
    const res2 = await cloudMusicApi.song_download_url({id:musicId,cookie,br})
    // 歌词  fix 播放器好像不能正常解析
    // const lyric = await cloudMusicApi.lyric({id:musicId,cookie})
    const dataUrl = res2.body.data.url;
    const fileTypeExt = res2.body.data.type ? res2.body.data.type : 'mp3'
    // 保存位置
    const savePath = rootDir + "网易云下载\\" + albumName + "\\" + artName + "\\" + saveName + "." + fileTypeExt;
    if (!fs.existsSync(savePath)) {
        replyMessage(message,`正在下载...\n专辑💽：${albumName}\n音乐🎧：${musicName}\n艺人🎨：${artName}`)
        const tags = {
            title: musicName,
            artist: artName,
            album: albumName,
            APIC: await FileBox.fromUrl(coverImg).toBuffer(),   // 专辑封面
            // unsynchronisedLyrics: { // 歌词
            //     language: "XXX",
            //     text: lyric.body.lrc.lyric
            // }
        }
        const fileBuffer = await FileBox.fromUrl(dataUrl).toBuffer(savePath)
        // 写入元信息
        const b = await NodeID3.write(tags, fileBuffer) // Returns true/Error
        createDirectory(savePath)
        await FileBox.fromBuffer(b).toFile(savePath,false)
        const fileObj = {
            name: saveName,
            type: 'file',
            size: b.length, // 文件大小（字节）
            fileType: '.' + res2.body.data.type, // 文件类型（后缀名）
            path: savePath, // 添加完整路径
            searchKey: saveName,
        }
        updateFileList(fileObj)
        console.log(savePath + " 保存成功！")
        return fileObj;
    }
    return null;
}
function createDirectory(filePath) {
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
        // 使用递归创建多级目录
        fs.mkdirSync(directory, { recursive: true });
    }
}
module.exports = {downloadMusic}
