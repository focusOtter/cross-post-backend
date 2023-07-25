import * as AWS from 'aws-sdk'

exports.handler = async (event: any) => {
	const date = new Date()
	const isoDate = date.toISOString()
	console.log('Processing event: ', event)
}
