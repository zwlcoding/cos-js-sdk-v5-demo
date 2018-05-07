const express = require('express');
const app = express();
const __PORT = 11175;

const getTempKeys = require('./cosAuth/getTempKeys')
const getAuth = require('./cosAuth/getAuth')

app.get('/test', function(req, res){
  res.json({
      test: 'is work'
  });
  res.end()
})

app.get('/cosAuth', function (req, res) {


  let resData = {}
  res.set({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'origin,accept,content-type',
  })

  // 获取前端过来的参数
  let method = req.query.method;
  let pathname = decodeURIComponent(req.query.pathname);

  if( req.query.headers ){
      let fileSize = req.query.headers['Content-Length'] //单位 b

      if(fileSize >  1024 * 1024 * 10){ //文件内容大于 10 M
          resData.code = 1
          resData.msg = '文件尺寸过大'
          res.json(resData)
          res.end()
          return
      }
  }else{
      resData.code = 9999
      resData.msg = '请先上传文件'
      res.json(resData)
      res.end()
      return
  }


  getTempKeys( (err, tempKeys)=> {

    if (err) {
      resData.code = 2
      resData.msg = '底层加签接口异常'
    } else {
      resData.code = 0
      resData.msg = ''
      resData.data = {
        Authorization: getAuth(tempKeys, method, pathname),
        TmpSecretId: tempKeys['credentials'] && tempKeys['credentials']['tmpSecretId'],
        TmpSecretKey: tempKeys['credentials'] && tempKeys['credentials']['tmpSecretKey'],
        ExpiredTime: tempKeys['expiredTime'],
        XCosSecurityToken: tempKeys['credentials'] && tempKeys['credentials']['sessionToken'],
      }
    }
    res.json(resData)
    res.end();

  } )

});

const server = app.listen( __PORT, function () {
  let host = server.address().address;
  let port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
