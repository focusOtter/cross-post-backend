import AWS = require('aws-sdk')

export type publishingProps = {
	frontmatter: Record<string, any>
	content: string
}
export const hugoShortcodes = {
	// Regular expression to match the Twitter shortcode format {{< tweet user="..." id="..." >}}
	twitterRegex: /{{< tweet user="(.*?)" id="(.*?)" >}}/g,
	// Regular expression to match the YouTube shortcode format {{< youtube ... >}}
	youtubeRegex: /{{< youtube (.*?) >}}/g,
	// Regular expression to match the GitHub Gist shortcode format {{< gist username gistId >}}
	gistRegex: /{{< gist (.*?) (.*?) >}}/g,
}

export async function getSecretFromParameterStore(secretName: string) {
	// Create an AWS SSM client
	const ssm = new AWS.SSM()

	// Specify the parameter name with the full path, including the leading "/"
	const parameterName = `/${secretName}`

	try {
		// Get the secret value from AWS Parameter Store
		const result = await ssm
			.getParameter({ Name: parameterName, WithDecryption: true })
			.promise()

		// The result will have the secret value in the 'Parameter.Value' field
		if (!result.Parameter) {
			throw new Error('No parameter found')
		}

		console.log('Parameter found:', result.Parameter.Value)
		return result.Parameter.Value
	} catch (err) {
		console.error('Error fetching secret from Parameter Store:', err)
		throw err
	}
}
