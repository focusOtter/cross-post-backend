# Focus Otter Cross Post

![arch diagram](../notes/cross-post.drawio.png)

This can basically be split up into 5 main parts:

0. Calling a Lambda from a GitHub action✅
1. Getting the markdown file✅
2. Transforming the markdown file
3. Cross posting to the relevant platforms
4. Sending a notification that the files were cross posted

### Creating the Lambda function

The GitHub action isn't actually deploying anything. I just needs to call a Lambda function. I'll do the following steps:

1. Create the lambda function✅
2. Add a function URL (include a cfnoutput of the URL)✅
3. Create a github action that calls the function✅
4. Log out the event of the function✅
5. Deploy✅
6. Store the secret in GitHub✅
7. Test: Commit and Verify✅

It worked 🎉
I enhanced the action to pass github details as well:

```yml
steps:
  - name: Call endpoint
    run: |
      curl -X POST -H "Content-Type: application/json" \
      -d '{
        "ref": "${{ github.ref }}", 
        "repo": "${{ github.repository }}", 
        "commit": "${{ github.event.after }}"
        }' \
       ${{ secrets.ENDPOINT }}
```

This produced the following output:

```json
{"body": '{\n' +
    '  "ref": "refs/heads/main", \n' +
    '  "repo": "focusOtter/cross-post-backend", \n' +
    '  "commit": "dedf137e23af6cf98c79357d666231c10b4bb982"\n' +
    '  }',}
```

## Getting the markdown file.

I'm pretty much going to look over Allen's code and compare that with what chatGPT gives me and find somewhere in between that I like.

The Lambda will fetch the current commit sha (from the `body.commit` parameter) and compare it with the previous commit to see what files have changed.

From here, I should be able to grab the markdown file.

I'm going to create a new directory called `samplePosts` with a test markdown file. Allen gave me one of his blog posts to help me out.

I was curious how to get the previous commit, but [GitHub has a `^` utility](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/viewing-and-comparing-commits/comparing-commits#comparisons-across-commits). If you add this to a commit sha (like we have above), it automatically gets the previous commit sha.

> 🗒️ Note: The `^` can be tacked on multiple times. So `^^^` means get me the commit sha from 3 commits ago. If this feels tedious (getting 10 commit prior for example, you can do `~10`.)

So it looks like I'll need the [Octokit package](https://www.npmjs.com/package/octokit). I'll use the REST version.

So to put it together, it'll be getting the secret from secrets manaager, then putting that in the Octokit library, from there, calling the `comparCommits` endpoint and manipulating the result to get the file I need

I got a `could not read .split` of undefined. I'm assuming this is because the `event` object is a string.

I renamed the `event` arg to `eventString` and refactored to this:

```ts
const event = JSON.parse(eventString)
```

redeployed (I should really enable watch mode for this stuff lol)

Oh wait. `event` is an object, but `event.body` is a string 🤦‍♂️

Oh interesting. It looks like Octokit expect `fetch` to be available. In my node 16 Lambda, I'm not doing that, so I import `node-fetch` and add it:

```ts
const octokit = new Octokit({
	auth: secretValue,
	request: {
		fetch: fetch,
	},
})
```

This worked 🎉 and gave me the following:

````txt
2023-07-25T16:48:39.632Z	e86750dd-1e09-4ed5-a8ae-656b31971c4d	INFO	Commited files:  [
  {
    sha: 'f186aae60370547b61ee77361b54c10797f95222',
    filename: 'notes/index.md',
    status: 'modified',
    additions: 11,
    deletions: 0,
    changes: 11,
    blob_url: 'https://github.com/focusOtter/cross-post-backend/blob/f775078703edd39505b9a2ffed992dcfc354c80b/notes%2Findex.md',
    raw_url: 'https://github.com/focusOtter/cross-post-backend/raw/f775078703edd39505b9a2ffed992dcfc354c80b/notes%2Findex.md',
    contents_url: 'https://api.github.com/repos/focusOtter/cross-post-backend/contents/notes%2Findex.md?ref=f775078703edd39505b9a2ffed992dcfc354c80b',
    patch: '@@ -77,3 +77,14 @@ const event = JSON.parse(eventString)\n' +
      ' redeployed (I should really enable watch mode for this stuff lol)\n' +
      ' \n' +
      ' Oh wait. `event` is an object, but `event.body` is a string 🤦‍♂️\n' +
      '+\n' +
      "+Oh interesting. It looks like Octokit expect `fetch` to be available. In my node 16 Lambda, I'm not doing that, so I import `node-fetch` and add it:\n" +
      '+\n' +
      '+```ts\n' +
      '+const octokit = new Octokit({\n' +
      '+\tauth: secretValue,\n' +
      '+\trequest: {\n' +
      '+\t\tfetch: fetch,\n' +
      '+\t},\n' +
      '+})\n' +
      '+```'
  }
]
````

> 🗒️ Note: At this point, I've used 88mb of my 128mb. With a cold start, this is taking 1209ms with a 568ms init Duration.

I tried a lot of different combos to get this to work. In the end, all I had to do was pass

```js
mediaType: {
					format: 'raw',
				},
```

To the following function to get the actual data back:

```ts
const getContentReponse: any = await octokit.repos.getContent({
	owner,
	repo,
	mediaType: {
		format: 'raw',
	},
	path: committedFiles[0].filename,
})
```

The response has the `status`, `url`, `headers` and `data`. So long as the file is under **1mb**, then the file will be output as a string (of markdown in this case) under `response.data`.

## Transforming the markdown file

Now that I have the markdown file, my goal is to transform the markdown file in something that can be sent off to the respective APIs.

This means I have to transfer over the Hugo shortcodes to something that other platforms understand. It also means relative links to my blog should point to blog posts on those respective platforms (this sounds like it's full of edgecases 🤔), and it means possibly removing frontmatter in case the platform doesn't support it.

Allen has the code that does this but I'm going to do thing differently since my profile data isn't coming from DynamoDB (yet) and because I want to understand what is happening, I'm going to do this primarily on my own.

> 🗒️ It was at this point that I decided to 1. Not use Medium because their API has a discliamer that it shoudln't be used. and 2. To not transform links to other blog posts because blog posts may not exist on the other platforms and there are too many edgecases. I'll use this as a way to get customers over to your main blog. So I'm just support the primary blog, hashnode and dev.to at this point.

### Learnings

I spent some time playing around with this and learned the following:

1. For `dev.to` the frontmatter is read and takes prescedence over any API params
   - The `date` field has to be in the format `2023-07-26T17:45:12Z`
   - The `series` field can only be a single series string, not an array
2. For Hashnode, they do not extrapolate frontmatter, this has to be removed before hand.
   - For tags, use this:

```graphql
query listTags {
	tagCategories {
		_id
		name
		slug
	}
}
```

So before uploading, I should:

1. Extract the frontmatter, using the `@github-docs/frontmatter` package (make any changes I need to)
2. Create a function that transforms the shortcodes to platform specific shortcodes
3. If the platform expects frontmatter then put it back together, if not, then just send the content
