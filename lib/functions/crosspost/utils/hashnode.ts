import { frontmatter } from '@github-docs/frontmatter'
import { hashnodeAPIKey, hugoShortcodes, publishingProps } from './shared'

function replaceShortcodesForHashnode(inputString: string) {
	// Replace Twitter shortcodes
	inputString = inputString.replaceAll(
		hugoShortcodes.twitterRegex,
		'%[https://twitter.com/$1/status/$2]'
	)
	// Replace YouTube shortcodes
	inputString = inputString.replaceAll(
		hugoShortcodes.youtubeRegex,
		'%[https://youtu.be/$1]'
	)
	// Replace GitHub Gist shortcodes
	inputString = inputString.replaceAll(
		hugoShortcodes.gistRegex,
		'%[https://gist.github.com/$1/$2]'
	)

	return inputString
}

export function prepForHashnodePublishing(postWithFrontmatter: string): {
	frontmatter: Record<string, any>
	content: string
} {
	const { data, content, errors } = frontmatter(postWithFrontmatter)

	const hashnodeContent = replaceShortcodesForHashnode(content)

	//hashnode will not remove any frontmatter, so make sure "content" doesn't include it
	return { frontmatter: data, content: hashnodeContent }
}

export function publishToHashnode({ frontmatter, content }: publishingProps) {
	return fetch('https://api.hashnode.com', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: hashnodeAPIKey,
		},
		body: JSON.stringify({
			query:
				'mutation createStory($input: CreateStoryInput!){ createStory(input: $input){ code success message } }',
			variables: {
				input: {
					isPartOfPublication: { publicationId: '6033e395073b7f6738067ad0' },
					title: frontmatter.title,
					subtitle: frontmatter.description,
					isRepublished: {
						originalArticleURL: `https://focusotter.cloud/posts/${frontmatter.slug
							.toLowercase()
							.split(' ')
							.join('-')}`,
					},
					contentMarkdown: content,
					tags: [],
					coverImageURL: frontmatter.image,
				},
			},
		}),
	}).then((res) => res.json())
}

const getUserPublicationData = () => {
	return fetch('https://api.hashnode.com', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: hashnodeAPIKey,
		},
		body: JSON.stringify({
			query: `
				query getUserPublicationData($username: String!) {
					user(username: $username) {
						_id
					}
				}
			`,
			variables: {
				username: 'focusotter',
			},
		}),
	}).then((res) => {
		res.json().then(({ data }) => {
			console.log(data.user._id)
		})
	})
}
