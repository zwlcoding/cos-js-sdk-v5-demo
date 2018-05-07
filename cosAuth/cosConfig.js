const cosConfig = {
	Url: 'https://sts.api.qcloud.com/v2/index.php',
	Domain: 'sts.api.qcloud.com',
	SecretId: '改成你自己的值', //TODO 替换为生产的值
	SecretKey: '改成你自己的值', //TODO 替换为生产的值
	Bucket: '改成你自己的值', //TODO 替换为生产的值
	Region: 'ap-guangzhou', //TODO 替换为生产的值
	AllowPrefix: '*'
}

module.exports = cosConfig