// NOTE: Remove .git and reinitialise before publishing
const {
    Worker,
    isMainThread,
    parentPort,
    workerData
} = require('worker_threads')
const { Octokit } = require("@octokit/rest");
const differenceBy = require('lodash/differenceBy')

// Call GitHub's API
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

function queryGitHub(keyword, delay) {
    console.log('Checking for keyword:', keyword)
    let collectedIssues = []
    setInterval(() => {
        octokit.search.issuesAndPullRequests({
            q: `${keyword.replace(" ", "+")}+is:issue+state:open+NOT+Acunetix+NOT+syhunt+NOT+bump+NOT+upgrade+NOT+fix`,
            sort: 'created',
            order: 'desc',
            per_page: 100
        }).then((response) => {
            const latestCollection = response.data.items
            if (collectedIssues.length === 0) collectedIssues = latestCollection

            const newIssues = differenceBy(latestCollection, collectedIssues, 'id')
            if (newIssues.length) {
                console.log(`[${keyword}] New issue found:`, newIssues.map((issue) => {
                    return issue.html_url
                }))
            }

            collectedIssues = collectedIssues.concat(newIssues)
        })
    }, delay)
}

const keywords = ['error', 'issue', 'denial vulnerable', 'traversal vulnerable'] // MAX 20
const delayLength = 60000 / 20 * keywords.length // 1 minute rate limit / 20 requests per minute * amount of keywords
if (isMainThread) {
    console.log('Main: Starting the main thread.')
    for (var i = 0; i < keywords.length; i++) {
        // Create a new worker, referencing own filename
        new Worker(__filename, {
            workerData: { // Pass initial data to the Worker
                keyword: keywords[i],
                delay: delayLength
            }
        })
    }
} else { // Otherwise, we are on a worker thread, do work
    queryGitHub(workerData.keyword, workerData.delay)
}
          
           
                          



