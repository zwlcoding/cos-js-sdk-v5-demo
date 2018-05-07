const config = require('../cosConfig')
const crypto = require('crypto')
const util = {
  // 获取随机数
  getRandom: function (min, max) {
    return Math.round(Math.random() * (max - min) + min);
  },
  // json 转 query string
  json2str: function (obj, notEncode) {
    var arr = [];
    Object.keys(obj).sort().forEach(function (item) {
      var val = obj[item] || '';
      !notEncode && (val = val);
      arr.push(item + '=' + val);
    });
    return arr.join('&');
  },
  // 计算签名
  getSignature: function (opt, key, method) {
    var formatString = method + config.Domain + '/v2/index.php?' + util.json2str(opt, 1);
    var hmac = crypto.createHmac('sha1', key);
    var sign = hmac.update(new Buffer(formatString, 'utf8')).digest('base64');
    return sign;
  },
}

module.exports = util
