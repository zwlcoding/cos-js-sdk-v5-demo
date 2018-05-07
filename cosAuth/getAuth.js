
const crypto = require('crypto')

const getAuthorization = (keys, method, pathname) => {

  let SecretId = keys.credentials.tmpSecretId;
  let SecretKey = keys.credentials.tmpSecretKey;

  // 整理参数
  let query = {};
  let headers = {};
  method = (method ? method : 'get').toLowerCase();
  pathname = pathname ? pathname : '/';
  pathname.indexOf('/') === -1 && (pathname = '/' + pathname);

  // 工具方法
  let getObjectKeys = function (obj) {
    let list = [];
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        list.push(key);
      }
    }
    return list.sort();
  };

  let obj2str = function (obj) {
    let i, key, val;
    let list = [];
    let keyList = getObjectKeys(obj);
    for (i = 0; i < keyList.length; i++) {
      key = keyList[i];
      val = (obj[key] === undefined || obj[key] === null) ? '' : ('' + obj[key]);
      key = key.toLowerCase();
      key = camSafeUrlEncode(key);
      val = camSafeUrlEncode(val) || '';
      list.push(key + '=' +  val)
    }
    return list.join('&');
  };

  // 签名有效起止时间
  let now = parseInt(new Date().getTime() / 1000) - 1;
  let expired = now + 600; // 签名过期时刻，600 秒后

  // 要用到的 Authorization 参数列表
  let qSignAlgorithm = 'sha1';
  let qAk = SecretId;
  let qSignTime = now + ';' + expired;
  let qKeyTime = now + ';' + expired;
  let qHeaderList = getObjectKeys(headers).join(';').toLowerCase();
  let qUrlParamList = getObjectKeys(query).join(';').toLowerCase();

  // 签名算法说明文档：https://www.qcloud.com/document/product/436/7778
  // 步骤一：计算 SignKey
  let signKey = crypto.createHmac('sha1', SecretKey).update(qKeyTime).digest('hex');

  // 步骤二：构成 FormatString
  let formatString = [method.toLowerCase(), pathname, obj2str(query), obj2str(headers), ''].join('\n');

  // 步骤三：计算 StringToSign
  let stringToSign = ['sha1', qSignTime, crypto.createHash('sha1').update(formatString).digest('hex'), ''].join('\n');

  // 步骤四：计算 Signature
  let qSignature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex');

  // 步骤五：构造 Authorization
  let authorization  = [
    'q-sign-algorithm=' + qSignAlgorithm,
    'q-ak=' + qAk,
    'q-sign-time=' + qSignTime,
    'q-key-time=' + qKeyTime,
    'q-header-list=' + qHeaderList,
    'q-url-param-list=' + qUrlParamList,
    'q-signature=' + qSignature
  ].join('&');

  return authorization;
}

module.exports = getAuthorization
