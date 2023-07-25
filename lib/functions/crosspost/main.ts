import * as AWS from 'aws-sdk'
import { Octokit } from '@octokit/rest'

const secretsmanager = new AWS.SecretsManager()

exports.handler = async (event: any) => {
	const params = {
		SecretId: 'github-token',
	}

	try {
		const response = await secretsmanager.getSecretValue(params).promise()
		const secretValue = response.SecretString

		const octokit = new Octokit({
			auth: secretValue,
		})

		const owner = event.body.repo.split('/')[0] // Get the owner from the repo name
		const repo = event.body.repo.split('/')[1] // Get the repo from the repo name
		const commit = event.body.commit // Get the commit SHA

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

		console.log('Processing event: ', event)
	} catch (err: any) {
		console.log(err, err.stack) // an error occurred
	}
}
