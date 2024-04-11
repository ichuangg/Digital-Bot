const ip = require('ip')
const {log} = require('wechaty')
/**
 * ip过滤策略
 */
module.exports = (options) => {
    let policy; // 策略：白名单还是黑名单
    let onRestrict; // IP禁止访问后的回调函数

    if (!(options instanceof Object)) {
        throw new Error('options must be an Object');
    }

    if (options.onRestrict) {
        if (typeof options.onRestrict !== 'function') {
            throw new Error('onRestrict must be a function');
        }
        onRestrict = options.onRestrict;
    }

    if (options.whitelist) {
        if (!(options.whitelist instanceof Set)) {
            throw new Error('whitelist must be a Set');
        }
        policy = 'white';
    }

    if (policy) { // whitelist policy
        if (options.blacklist) {
            throw new Error('whitelist and blacklist are exclusive');
        }
    } else if (options.blacklist) { // blacklist policy
        if (!(options.blacklist instanceof Set)) {
            throw new Error('blacklist must be a Set');
        }
        if (options.allowPrivate) {
            console.warn('allowPrivate only work with whitelist');
        }
    } else { // no policy
        throw new Error('must provide whitelist or blacklist');
    }

    let trustedHeaderSequence = ['x-forwarded-for', 'x-real-ip']; // 默认先看 x-forwarded-for 再看 x-real-ip
    if (options.trustedHeaderSequence instanceof Array) {
        trustedHeaderSequence = options.trustedHeaderSequence.map(c => c.toLowerCase());
    }

    function checkWhitelist(ipToCheck) {
        return options.whitelist.has(ipToCheck) || (options.allowPrivate && ip.isPrivate(ipToCheck));
    }

    function checkBlacklist(ipToCheck) {
        return !options.blacklist.has(ipToCheck);
    }

    return (req, res, next) => {
        let ipFromHeader;

        for (let field of trustedHeaderSequence) {
            if (req.headers[field]) {
                ipFromHeader = req.headers[field].split(', ')[0]; // 取 xx, yy, zz 最先出现的地址
                break;
            }
        }
        // Windows 下 ipv6解析
        let ipToCheck;
        if (!ipFromHeader) {
            ipToCheck = req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
            ipToCheck = ipToCheck.split(":").pop()
        } else {
            ipToCheck = ipFromHeader;
        }

        let pass = policy === 'white' ? checkWhitelist(ipToCheck) : checkBlacklist(ipToCheck);
        if (!pass && ipToCheck !== "1" && ipToCheck !== "127.0.0.1") {
            if (onRestrict) {
                onRestrict(req, res, next, ipToCheck);
            } else {
                let err = new Error('IP restricted' + ipToCheck + "==>" + req.url);
                err.ip = ipToCheck;
                next(err);
            }
        } else {
            log.info(`IP ${ipToCheck} to ${req.url}`)
            next();
        }
    }
}
