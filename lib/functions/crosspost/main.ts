import * as AWS from 'aws-sdk'
import { Octokit } from '@octokit/rest'
import fetch from 'node-fetch'
import { prepForDevToPublishing, publishToDevTo } from './utils/devTo'
import { prepForHashnodePublishing, publishToHashnode } from './utils/hashnode'

const secretsmanager = new AWS.SecretsManager()

exports.handler = async (event: any) => {
	const eventBody = JSON.parse(event.body)
	// get the github token from secrets manager
	// in future iterations, the token will not be needed because the frontend will have already pushed to github by fetching the files like so:
	// octokit.repos.getContent({
	// 	owner,
	// 	repo,
	// 	path: '',
	// })

	const params = {
		SecretId: 'github-token',
	}

	try {
		const response = await secretsmanager.getSecretValue(params).promise()
		const secretValue = response.SecretString

		// create an octokit instance with the token
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

		// Get the list of files that have been changed since the commit
		const gitResponse = await octokit.repos.compareCommits({
			owner,
			repo,
			base: `${commit}^`, // This is one commit back
			head: commit,
		})

		// Filter the list of files to only include markdown files
		if (gitResponse.data.files) {
			committedFiles = gitResponse.data.files.filter((file) =>
				file.filename.includes('.md')
			)
		}

		console.log('Commited files: ', committedFiles)

		// Get the content of the first file in the list of changed files
		try {
			const getContentReponse = await octokit.repos.getContent({
				owner,
				repo,
				mediaType: {
					format: 'raw',
				},
				path: committedFiles[0].filename,
			})

			//the changed markdown file:
			console.log('the changed markdown file:', getContentReponse.data)
			const mainBlogContent = getContentReponse.data as unknown as string

			// format for the respective platforms
			const devToPublishingContent = prepForDevToPublishing(mainBlogContent)
			const hashnodePublishingContent =
				prepForHashnodePublishing(mainBlogContent)

			// publish to the respective platforms
			publishToDevTo({
				frontmatter: devToPublishingContent.frontmatter,
				content: devToPublishingContent.content,
			})
			publishToHashnode({
				frontmatter: hashnodePublishingContent.frontmatter,
				content: hashnodePublishingContent.content,
			})

			// replace shortcodes with the respective platforms

			//the frontmatter of the changed markdown file:
		} catch (err) {
			console.error(err)
		}
	} catch (err: any) {
		console.log(err, err.stack) // an error occurred
	}
}
