import { frontmatter } from '@github-docs/frontmatter'
import { devToAPIKey, hugoShortcodes, publishingProps } from './shared'

// this takes in the data.date field in frontmatter and converts it to the desired format

function convertDateFormat(date: string) {
	// Regular expression to match the "YYYY-MM-DD" format
	const regex = /^\d{4}-\d{2}-\d{2}$/

	if (regex.test(date)) {
		const currentDate = new Date().toISOString().split('T')[0]
		if (currentDate === date) {
			// If the input string is already in the desired format, return it as is
			return date
		} else {
			// Convert the "YYYY-MM-DD" format to "YYYY-MM-DDTHH:mm:ssZ" format
			const currentTime = new Date().toISOString().split('T')[1].slice(0, -1)
			return `${date}T${currentTime}`
		}
	} else {
		// If the input string is not in the expected format, return null or throw an error as desired
		return null
	}
}

function replaceShortcodesForDevTo(inputString: string) {
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
	const devToDate = convertDateFormat(data.date)
	const devToFrontmatter = {
		...data,
		date: devToDate,
	}

	const devToContent = replaceShortcodesForDevTo(content)

	return { frontmatter: devToFrontmatter, content: devToContent }
}

// Publish to Dev.to
export function publishToDevTo({ frontmatter, content }: publishingProps) {
	return fetch('https://dev.to/api/articles', {
		method: 'POST',
		headers: {
			accept: 'application/vnd.forem.api-v1+json',
			'content-type': 'application/json',
			'api-key': devToAPIKey,
		},
		body: JSON.stringify({
			article: {
				title: frontmatter.title,
				published: false,
				series: 'my-series, other series',
				main_image: frontmatter.image,
				canonical_url: `https://focusotter.cloud/posts/${frontmatter.slug
					.toLowercase()
					.split(' ')
					.join('-')}`,
				description: frontmatter.description,
				body_markdown: content,
			},
		}),
	}).then((res) => res.json())
}
