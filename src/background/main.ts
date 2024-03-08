import { onMessage, sendMessage } from 'webext-bridge/background'
import { type Tabs, webRequest } from 'webextension-polyfill'

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

browser.runtime.onInstalled.addListener((): void => {
  // eslint-disable-next-line no-console
  console.log('Extension installed')
})

let previousTabId = 0

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!previousTabId) {
    previousTabId = tabId
    return
  }

  let tab: Tabs.Tab

  try {
    tab = await browser.tabs.get(previousTabId)
    previousTabId = tabId
  }
  catch {
    return
  }

  sendMessage('tab-prev', { title: tab.title }, { context: 'content-script', tabId })
})

function getRepoFromUrl(url: URL) {
  const serviceLocation = url.pathname.split('/').at(1)
  return ({
    fedmlOpsServer: 'MLOpsCloud',
    fedmlModelServer: 'model-serving-backend',
    userCenter: 'MLOpsCloud-UserCenter',
    cheetah: 'MLOpsCloud-Cheetah',
    payment: 'MLOpsCloud-Payment',
    llm: 'FedML-LLMFlow',
    system: 'MLOpsCloud-Log',
    inference: 'model-serving-backend',
    aiagent: 'FedML-AI-Agent-Server',
  })?.[serviceLocation!]
}

function getKeywordFromUrl(url: URL) {
  return url.pathname.split('/').at(-1)
}

webRequest.onResponseStarted.addListener(
  (target) => {
    const parsedUrl = new URL(target.url)

    const repo = getRepoFromUrl(parsedUrl)
    const keyword = getKeywordFromUrl(parsedUrl)
    if (!repo)
      return

    // const baseUrl =
    const searchQ = `repo:FedML-Inc/${repo} /${keyword}`

    const githubSearchUrl = new URL('https://github.com/search')

    githubSearchUrl.search = new URLSearchParams({
      q: searchQ,
      type: 'code',
    }).toString()

    sendMessage('github-search', {
      githubSearchUrl: githubSearchUrl.href,
      url: target.url,
    }, {
      context: 'content-script',
      tabId: target.tabId,
    })
  },
  { urls: ['<all_urls>'], types: ['xmlhttprequest', 'object'] },
  ['extraHeaders', 'responseHeaders'],
)

onMessage('get-current-tab', async () => {
  try {
    const tab = await browser.tabs.get(previousTabId)
    return {
      title: tab?.title,
    }
  }
  catch {
    return {
      title: undefined,
    }
  }
})
