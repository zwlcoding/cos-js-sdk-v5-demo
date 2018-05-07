const cosConfig = require('./cosConfig')
const util = require('./utils/util')
const request = require('request')

let tempKeysCache = {
  policyStr: '',
  expiredTime: 0
}

// 拼接获取临时密钥的参数
const getTempKeys = (callback) => {

  // 判断是否修改了 AllowPrefix
  if (cosConfig.AllowPrefix === '_ALLOW_DIR_/*') {
    callback({error: '请修改 AllowPrefix 配置项，指定允许上传的路径前缀'});
    return;
  }

  // 定义绑定临时密钥的权限策略
  let ShortBucketName = cosConfig.Bucket.substr(0 , cosConfig.Bucket.lastIndexOf('-'));
  let AppId = cosConfig.Bucket.substr(1 + cosConfig.Bucket.lastIndexOf('-'));
  let policy = {
    'version': '2.0',
    'statement': [{
      'action': [
        // 这里可以从临时密钥的权限上控制前端允许的操作
        'name/cos:*', // 这样写可以包含下面所有权限

        // // 列出所有允许的操作
        // // ACL 读写
        // 'name/cos:GetBucketACL',
        // 'name/cos:PutBucketACL',
        // 'name/cos:GetObjectACL',
        // 'name/cos:PutObjectACL',
        // // 简单 Bucket 操作
        // 'name/cos:PutBucket',
        // 'name/cos:HeadBucket',
        // 'name/cos:GetBucket',
        // 'name/cos:DeleteBucket',
        // 'name/cos:GetBucketLocation',
        // // Versioning
        // 'name/cos:PutBucketVersioning',
        // 'name/cos:GetBucketVersioning',
        // // CORS
        // 'name/cos:PutBucketCORS',
        // 'name/cos:GetBucketCORS',
        // 'name/cos:DeleteBucketCORS',
        // // Lifecycle
        // 'name/cos:PutBucketLifecycle',
        // 'name/cos:GetBucketLifecycle',
        // 'name/cos:DeleteBucketLifecycle',
        // // Replication
        // 'name/cos:PutBucketReplication',
        // 'name/cos:GetBucketReplication',
        // 'name/cos:DeleteBucketReplication',
        // // 删除文件
        // 'name/cos:DeleteMultipleObject',
        // 'name/cos:DeleteObject',
        // 简单文件操作
        // 'name/cos:PutObject',
        // 'name/cos:PostObject',
        // 'name/cos:AppendObject',
        // 'name/cos:GetObject',
        // 'name/cos:HeadObject',
        // 'name/cos:OptionsObject',
        // 'name/cos:PutObjectCopy',
        // 'name/cos:PostObjectRestore',
        // // 分片上传操作
        // 'name/cos:InitiateMultipartUpload',
        // 'name/cos:ListMultipartUploads',
        // 'name/cos:ListParts',
        // 'name/cos:UploadPart',
        // 'name/cos:CompleteMultipartUpload',
        // 'name/cos:AbortMultipartUpload',
      ],
      'effect': 'allow',
      'principal': {'qcs': ['*']},
      'resource': [
        'qcs::cos:' + cosConfig.Region + ':uid/' + AppId + ':prefix//' + AppId + '/' + ShortBucketName + '/',
        'qcs::cos:' + cosConfig.Region + ':uid/' + AppId + ':prefix//' + AppId + '/' + ShortBucketName + '/' + cosConfig.AllowPrefix
      ]
    }]
  };

  let policyStr = JSON.stringify(policy);

  // 有效时间小于 30 秒就重新获取临时密钥，否则使用缓存的临时密钥
  if (tempKeysCache.expiredTime - Date.now() / 1000 > 30 && tempKeysCache.policyStr === policyStr) {
    callback(null, tempKeysCache);
    return;
  }

  let Action = 'GetFederationToken';
  let Nonce = util.getRandom(10000, 20000);
  let Timestamp = parseInt(+new Date() / 1000);
  let Method = 'GET';

  let params = {
    Action: Action,
    Nonce: Nonce,
    Region: '',
    SecretId: cosConfig.SecretId,
    Timestamp: Timestamp,
    durationSeconds: 7200,
    name: '',
    policy: policyStr,
  };
  params.Signature = encodeURIComponent(util.getSignature(params, cosConfig.SecretKey, Method));

  let opt = {
    method: Method,
    url: cosConfig.Url + '?' + util.json2str(params),
    rejectUnauthorized: false,
    headers: {
      Host: cosConfig.Domain
    },
    proxy: cosConfig.Proxy || '',
  };
  request(opt, function (err, response, body) {
    body = body && JSON.parse(body);
    let data = body.data;
    tempKeysCache = data;
    tempKeysCache.policyStr = policyStr;
    callback(err, data);
  });
}

module.exports = getTempKeys
