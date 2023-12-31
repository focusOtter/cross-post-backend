const frontmatter = require('@github-docs/frontmatter')
import fetch from 'node-fetch'

import {
	getSecretFromParameterStore,
	hugoShortcodes,
	publishingProps,
} from './shared'

export const devToAPIKeyName = 'crosspost-devto-apikey'

// this takes in the data.date field in frontmatter and converts it to the desired format

// function convertDateFormat(date: string) {
// 	// Regular expression to match the "YYYY-MM-DD" format
// 	const regex = /^\d{4}-\d{2}-\d{2}$/
// 	const currentTime = new Date().toISOString().split('T')[1]
// 	// If the input string matches the "YYYY-MM-DD" format
// 	if (regex.test(date)) {
// 		// '2023-07-27T17:58:57.117Z'
// 		return `${date}T${currentTime}`
// 	} else {
// 		return date
// 	}
// }

function replaceShortcodesForDevTo(inputString: string) {
	console.log('in the data replacer')
	// Replace Twitter shortcodes with Dev.to embeds
	inputString = inputString.replaceAll(
		hugoShortcodes.twitterRegex,
		'{% embed https://twitter.com/$1/status/$2 %}'
	)
	// Replace YouTube shortcodes with Dev.to embeds
	inputString = inputString.replaceAll(
		hugoShortcodes.youtubeRegex,
		'{% embed https://www.youtube.com/watch?v=$1 %}'
	)
	// Replace GitHub Gist shortcodes with Dev.to embeds
	inputString = inputString.replaceAll(
		hugoShortcodes.gistRegex,
		'{% embed https://gist.github.com/$1/$2 %}'
	)

	return inputString
}

export function prepForDevToPublishing(postWithFrontmatter: string): {
	frontmatter: Record<string, any>
	content: string
} {
	const { data, content, errors } = frontmatter(postWithFrontmatter)
	console.log('the data', data)
	console.log('the rrors', errors)

	const devToContent = replaceShortcodesForDevTo(content)
	console.log('done replacing data')

	return { frontmatter: data, content: devToContent }
}

// Publish to Dev.to
export async function publishToDevTo({
	frontmatter,
	content,
}: publishingProps) {
	const devToAPIKey = await getSecretFromParameterStore(devToAPIKeyName)

	const res = await fetch('https://dev.to/api/articles', {
		method: 'POST',
		headers: {
			accept: 'application/vnd.forem.api-v1+json',
			'content-type': 'application/json',
			'api-key': devToAPIKey as string,
		},
		body: JSON.stringify({
			article: {
				title: frontmatter.title,
				body_markdown: content,
				description: frontmatter.description,
				published: false,
				series: 'my-series, other series',
				main_image: frontmatter.image,
				canonical_url: `https://focusotter.cloud/posts/${frontmatter.slug}`
					.toLowerCase()
					.split(' ')
					.join('-'),
			},
		}),
	})

	return await res.json()
}
