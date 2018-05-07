

cd /server_path

//pm2 start app.js
启动服务
npm run start


停止服务
npm run stop


---

接口已部署测试环境，测试桶

// health_check
http://domain/test


// cos 上传验签
http://domain/cosAuth


以上为服务端信息




---



以下为前端调用方式


```javascript
// 这里简单封装了一个库 getCosAuth.js
// 获取加签信息

let COS_AUTH_API = 'http://domain/cosAuth'

const getCosAuth = (options, callback, fetchCB) => {
  let method = (options.Method || 'get').toLowerCase();
  let key = options.Key || '';
  let query = options.Query || {};
  let headers = options.Headers || {};
  let pathname = key.indexOf('/') === 0 ? key : '/' + key;
  let reqData = {
    method: method,
    pathname: pathname,
    query: query,
    headers: headers,
  }

  // 自行替换可用的 xhr 方法，
  // 不能使用 promise 的方式，
  // COS 库链式调用，会有 this 的指向错误问题。

  window.__$.ajax({
    type: 'get',
    url: COS_AUTH_API,
    data: reqData,
    success: function (res) {
      let callbackData = {}
      callbackData.code = res.code // 可在服务端代码修改对应的 code， 0成功, 1文件过大 >10M（请在服务端修改这个最大限制）, 2 底层加签接口异常
      callbackData.msg = res.msg
      if (res.code === 0) {
        callbackData.Authorization = res.data.Authorization
        callbackData.TmpSecretId = res.data.TmpSecretId
        callbackData.TmpSecretKey = res.data.TmpSecretKey
        callbackData.ExpiredTime = res.data.ExpiredTime
        callbackData.XCosSecurityToken = res.data.XCosSecurityToken
        callback(callbackData)
      } else {
        fetchCB(callbackData)
      }
    },
    error: function () {
      fetchCB({
        code: 3,
        msg: 'rest加签接口异常'
      })

    }
  })

}

export default getCosAuth

```


// 在自己的项目中 引入 COS 库和 封装好的 auth 库。调用 putObject 即可 

```javascript
import COS from 'cos-js-sdk-v5'
import getCosAuth from '../../../utils/getCosAuth'; //自行修改 import 的路径


//这里以 react 为例子
class App extends React.Component {

  constructor(props) {
    super(props)


    this.state = {
      bucket: '填写你自己的bucket', //TODO 改成你自己的值
      region: 'ap-guangzhou'
    }

    //初始化COS的配置
    let cosOpts = {
      getAuthorization: (options, callback)=>{
        getCosAuth(options, callback, (fetchRes) => {
          // 可以在这里面统一处理各种异常情况
          // fetchRes.code === 0 上传成功
          // fetchRes.code === 1 文件过大
          // fetchRes.code === 2 底层加签接口异常，腾讯云的问题
          // fetchRes.code === 3 rest加签接口异常，自己的接口超时等
          // fetchRes.code === 9999 没传文件
          console.log(fetchRes)
        })
      }
    }
    this.cos = new COS(cosOpts)
    
  }

  //处理文件上传
  uploadFile() {
    let file = this.refs.uploadFile.files[0]
    if (!file) {
      return
    }
    this.cos.putObject({
      Bucket: this.state.bucket, // Bucket 格式：test-1250000000
      Region: this.state.region,
      Key: file.name,
      Body: file,
      onProgress: (info) => {
        console.log(info)
      }
    }, function (err, data) {
      console.log(data)
    });
  }


  render() {
    return (
      <div>
        <h1>测试文件上传</h1>
        <input type="file" ref={'uploadFile'} onChange={() => {
          this.uploadFile()
        }}/>
      </div>

    );
  }
}

export default App

```