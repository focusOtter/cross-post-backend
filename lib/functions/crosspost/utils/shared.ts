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

export const devToAPIKey = 'VKLL1r4FtAfPN244XqSiaxK1'
export const hashnodeAPIKey = '9ee89e8a-1683-4298-9870-4828c2d4361f'
