const axios = require("./request");
const {musicCookieMap} = require('../utils/musicLogin.js')
module.exports = {uploadMusicToCloud}
const FormData = require('form-data');
const fs = require('fs');
// const mime = require('mime');

function uploadMusicToCloud(message,data) {
    const userInfo = musicCookieMap.get(message.talker().id)
    if (!userInfo) {
        message.talker().say("上传请先登录！回复（网易云登录）")
        return;
    }
    const formData = new FormData()
    const file = fs.createReadStream(data.path)
    // 获取文件的 MIME 类型
    // const contentType = mime.getType(data.path);
    // 添加文件到表单中
    formData.append('songFile', file, {
        filename: data.name,
    });
    axios.request({
        method: 'post',
        url: `/cloud?time=${Date.now()}&cookie=${userInfo.cookie}`,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        data: formData,
    }).then(res => {
        message.talker().say(`${data.name} 上传成功`)
    }).catch(async err => {
        console.log(err)
        message.talker().say(`丢，这首歌怎么都传不上：${data.name}`)
    })
}
