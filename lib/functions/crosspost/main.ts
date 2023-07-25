import * as AWS from 'aws-sdk'
import { Octokit } from '@octokit/rest'
import { Endpoints } from '@octokit/types'

import fetch from 'node-fetch'

const secretsmanager = new AWS.SecretsManager()

exports.handler = async (event: any) => {
	type fetchRepoContentsType =
		Endpoints['GET /repos/{owner}/{repo}/contents/{path}']['response']

	const eventBody = JSON.parse(event.body)
	console.log('Processing eventBody: ', eventBody)

	const params = {
		SecretId: 'github-token',
	}

	try {
		const response = await secretsmanager.getSecretValue(params).promise()
		const secretValue = response.SecretString

		const octokit = new Octokit({
			auth: secretValue,
			request: {
				fetch: fetch,
			},
		})

		const owner = eventBody.repo.split('/')[0] // Get the owner from the repo name
		const repo = eventBody.repo.split('/')[1] // Get the repo from the repo name
		const commit = eventBody.commit // Get the commit SHA

		let committedFiles: any[] = []

		const gitResponse = await octokit.repos.compareCommits({
			owner,
			repo,
			base: `${commit}^`, // This is one commit back
			head: commit,
		})

		if (gitResponse.data.files) {
			committedFiles = gitResponse.data.files.filter((file) =>
				file.filename.includes('.md')
			)
		}

		console.log('Commited files: ', committedFiles)

		try {
			const getContentReponse: any = await octokit.repos.getContent({
				owner,
				repo,
				mediaType: {
					format: 'raw',
				},
				path: committedFiles[0].filename,
			})

			console.log('Get content response: ', getContentReponse)

			console.log('the content response', getContentReponse.data)
			// if (getContentReponse.data.encoding === 'base64') {
			// 	const content = Buffer.from(getContentReponse.data, 'base64').toString(
			// 		'utf8'
			// 	)
			// 	console.log(content)
			// } else {
			// 	console.log('File content is not in base64 encoding.')
			// }
		} catch (err) {
			console.error(err)
		}
	} catch (err: any) {
		console.log(err, err.stack) // an error occurred
	}
}
