import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test.skip(process.env.WRITINGS_DEV_PREVIEW !== '1', 'Runs only against the bounded development preview.')

const writingPath = './writings/framework-preview'
const languageAwareWritingPath = './writings/language-aware-preview'

test('language-aware prose and code stay synchronized in single and Compare reading', async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 864 })
  await page.goto(languageAwareWritingPath)
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  await expect(page.getByRole('heading', { level: 1, name: 'Language-aware writing preview' })).toBeVisible()
  const reader = page.getByRole('group', { name: 'Read this article as' })
  await expect(reader).toHaveCount(1)
  await expect(reader.getByRole('radio', { name: 'C#' })).toBeChecked()
  await expect(page.getByRole('tab', { name: 'C#', selected: true })).toHaveCount(2)
  await expect(page.getByRole('tabpanel').nth(0)).toContainText('int count = 10;')
  await expect(page.getByRole('tabpanel').nth(1)).toContainText('count = 11;')
  const csharpModels = page.getByRole('region', { name: 'C# runtime model' })
  await expect(csharpModels).toHaveCount(5)
  await expect(page.getByText('Variable count directly contains the int value 10.'))
    .toBeAttached()
  await expect(page.getByText(
    'Variables a and b refer to the same Counter object. Its Value property is 10.',
    { exact: true },
  )).toBeAttached()
  await expect(csharpModels.nth(2).locator('[data-runtime-entity="variable"]')).toHaveCount(2)
  await expect(csharpModels.nth(2).locator('[data-runtime-entity="object"]')).toHaveCount(1)
  await expect(csharpModels.nth(3).getByText('Before mutation')).toBeVisible()
  await expect(csharpModels.nth(3).getByText('After mutation')).toBeVisible()
  await expect(csharpModels.nth(3).locator('[data-runtime-changed="true"]')).toHaveCount(1)
  await expect(csharpModels.nth(4).locator('[data-runtime-topology="split-target"]')).toHaveCount(1)
  await expect(csharpModels.nth(4).locator('[data-runtime-relationship-changed="true"]')).toHaveCount(1)
  await expect(page.getByText(/whose value is the integer/)).toBeVisible()
  await expect(page.getByText(/primitive type/)).toHaveCount(0)
  await page.screenshot({ path: 'visual-review/1536-language-aware-default.png', fullPage: false })

  const initialLocation = await page.evaluate(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    historyLength: window.history.length,
  }))
  const javaTab = page.getByRole('tab', { name: 'Java' }).first()
  await javaTab.scrollIntoViewIfNeeded()
  const scrollBeforeJava = await page.evaluate(() => window.scrollY)
  await javaTab.click()
  await expect(javaTab).toBeFocused()
  await expect(reader.getByRole('radio', { name: 'Java' })).toBeChecked()
  await expect(page.getByRole('tab', { name: 'Java', selected: true })).toHaveCount(2)
  await expect(page.getByRole('tabpanel').nth(0)).toContainText('int count = 10;')
  await expect(page.getByRole('tabpanel').nth(1)).toContainText('count = 11;')
  await expect(page.getByText(/primitive type/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'Java runtime model' })).toHaveCount(5)
  await expect(page.getByText(
    'Variables a and b refer to the same Counter object. Its value field is 10.',
    { exact: true },
  )).toBeAttached()
  await expect(page.getByRole('region', { name: 'Java runtime model' }).nth(4)
    .getByText(/After the reassignment, a still refers to the original Counter object/))
    .toBeAttached()
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBeforeJava)).toBeLessThanOrEqual(2)
  expect(await page.evaluate(() => window.localStorage.getItem('ferdinraphael.tech.preferred-code-language'))).toBe('java')

  await page.reload()
  await expect(page.getByRole('radio', { name: 'Java' })).toBeChecked()
  await expect(page.getByRole('tab', { name: 'Java', selected: true })).toHaveCount(2)
  await expect(page.getByText(/primitive type/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'Java runtime model' })).toHaveCount(5)

  await page.getByRole('radio', { name: 'Python' }).click()
  await expect(reader.getByRole('radio', { name: 'Python' })).toBeChecked()
  await expect(page.getByRole('tab', { name: 'Python', selected: true })).toHaveCount(2)
  await expect(page.getByRole('tabpanel').nth(0)).toContainText('count = 10')
  await expect(page.getByRole('tabpanel').nth(1)).toContainText('count = 11')
  await expect(page.getByText(/bound to an integer object/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'Python runtime model' })).toHaveCount(5)
  await expect(page.getByText('The name count is bound to an int object representing 10.'))
    .toBeAttached()
  await expect(page.getByText(
    'The names a and b are bound to the same Counter object. Its value field is 10.',
    { exact: true },
  )).toBeAttached()
  await expect(page.getByText(/After the mutation, a and b are still bound to the same Counter object/))
    .toBeAttached()
  await expect(page.getByText(/After the rebinding, a remains bound to the original Counter object/))
    .toBeAttached()
  await page.evaluate(() => {
    const copied: string[] = []
    ;(window as typeof window & { __copiedComparedCode?: string[] }).__copiedComparedCode = copied
    Object.defineProperty(navigator.clipboard, 'writeText', {
      configurable: true,
      value: async (text: string) => { copied.push(text) },
    })
  })
  await page.getByRole('radio', { name: 'Compare' }).click()
  await expect(page.getByRole('radio', { name: 'Compare' })).toBeChecked()
  await expect(page.getByRole('tablist')).toHaveCount(0)
  await expect(page.getByRole('tab')).toHaveCount(0)
  await expect(page.getByRole('tabpanel')).toHaveCount(0)
  const codeComparisons = page.getByRole('region', { name: 'Equivalent code comparison' })
  await expect(codeComparisons).toHaveCount(2)
  await expect(codeComparisons.first().locator('p')).toHaveText(['C#', 'Java', 'Python'])
  await expect(codeComparisons.first().locator('code.language-csharp .hljs-number')).toHaveText('10')
  await expect(codeComparisons.first().locator('code.language-java .hljs-number')).toHaveText('10')
  await expect(codeComparisons.first().locator('code.language-python .hljs-number')).toHaveText('10')
  const expectedComparedCode = [
    ['C#', 'int count = 10;'],
    ['Java', 'int count = 10;'],
    ['Python', 'count = 10'],
    ['C#', 'count = 11;'],
    ['Java', 'count = 11;'],
    ['Python', 'count = 11'],
  ] as const
  for (const [index, [language, expected]] of expectedComparedCode.entries()) {
    await codeComparisons.nth(Math.floor(index / 3))
      .getByRole('button', { name: `Copy ${language} code` })
      .click()
    const copied = await page.evaluate(() =>
      (window as typeof window & { __copiedComparedCode?: string[] }).__copiedComparedCode,
    )
    expect(copied?.at(-1)).toBe(expected)
  }
  const comparisons = page.getByRole('region', { name: 'Language comparison' })
  await expect(comparisons).toHaveCount(5)
  await expect(comparisons.first().locator('p').filter({ hasText: /^(C#|Java|Python)$/ })).toHaveText(['C#', 'Java', 'Python'])
  await expect(page.getByText(/whose value is the integer/)).toBeVisible()
  await expect(page.getByText(/primitive type/)).toBeVisible()
  await expect(page.getByText(/bound to an integer object/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'Python runtime model' })).toHaveCount(5)
  await expect(page.getByRole('region', { name: 'C# runtime model' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Java runtime model' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Python runtime model' }).first()
    .getByLabel('Python code', { exact: true })).toContainText('count = 10')
  const retainedSplit = page.getByRole('region', { name: 'Python runtime model' }).nth(4)
  await expect(retainedSplit.getByText('Before rebinding')).toBeVisible()
  await expect(retainedSplit.getByText('After rebinding')).toBeVisible()
  await expect(retainedSplit.locator('[data-runtime-object-identity="new"]')).toHaveCount(1)
  expect(await page.evaluate(() => window.localStorage.getItem('ferdinraphael.tech.preferred-code-language'))).toBe('python')
  await page.screenshot({ path: 'visual-review/1536-language-aware-compare.png', fullPage: false })

  await page.getByRole('radio', { name: 'Python' }).click()
  await expect(page.getByRole('radio', { name: 'Python' })).toBeChecked()
  await expect(page.getByRole('tab', { name: 'Python', selected: true })).toHaveCount(2)
  await expect(page.getByRole('region', { name: 'Python runtime model' })).toHaveCount(5)
  await expect(page.getByText(/primitive type/)).toHaveCount(0)
  expect(await page.evaluate(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
    historyLength: window.history.length,
  }))).toEqual(initialLocation)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)

  for (const viewport of [
    { width: 360, height: 800 },
    { width: 375, height: 667 },
    { width: 412, height: 767 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(languageAwareWritingPath)
    await page.getByRole('radio', { name: 'Compare' }).click()
    await expect(page.getByRole('radio', { name: 'Compare' })).toBeChecked()
    await expect(page.getByRole('region', { name: 'Language comparison' })).toHaveCount(5)
    await expect(page.getByRole('region', { name: 'Equivalent code comparison' })).toHaveCount(2)
    await expect(page.getByRole('region', { name: 'Python runtime model' })).toHaveCount(5)
    await expect(page.getByRole('tab')).toHaveCount(0)
    await expect(page.getByRole('radio', { name: 'Compare' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
    await page.screenshot({
      path: `visual-review/${viewport.width}-language-aware-compare.png`,
      fullPage: false,
    })
  }

  await page.goto('./writings/when-the-workaround-becomes-the-architecture')
  await expect(page.getByRole('group', { name: 'Read this article as' })).toHaveCount(0)
  await expect(page.getByRole('region', { name: /runtime model/ })).toHaveCount(0)
  await expect(page.getByRole('tab', { name: 'TypeScript' }).first()).toBeVisible()
})

test('runtime models including mutation and reassignment remain readable and bounded', async ({ page }) => {
  for (const viewport of [
    { width: 1536, height: 864, suffix: 'desktop' },
    { width: 375, height: 667, suffix: '375' },
    { width: 360, height: 800 },
    { width: 412, height: 767 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(languageAwareWritingPath)
    await page.getByRole('radio', { name: 'C#' }).click()
    const models = page.getByRole('region', { name: 'C# runtime model' })
    await expect(models).toHaveCount(5)
    await models.first().scrollIntoViewIfNeeded()
    await expect(models.first().getByText('count', { exact: true })).toBeVisible()
    await expect(models.first().getByText('int', { exact: true }).last()).toBeVisible()
    await expect(models.first().getByText('10', { exact: true }).last()).toBeVisible()
    await expect(models.nth(1).getByText('Counter', { exact: true }).last()).toBeVisible()
    await expect(models.nth(1).locator('dt')).toContainText('Value')
    await expect(models.nth(1).locator('dt')).toContainText('property')
    const sharedModel = models.nth(2)
    await expect(sharedModel.locator('[data-runtime-entity="variable"]')).toHaveCount(2)
    await expect(sharedModel.locator('[data-runtime-entity="object"]')).toHaveCount(1)
    await expect(sharedModel.locator('[data-runtime-entity="variable"]').nth(0)).toContainText('a')
    await expect(sharedModel.locator('[data-runtime-entity="variable"]').nth(1)).toContainText('b')
    await expect(sharedModel.locator('dt')).toContainText('Value')
    await expect(sharedModel.locator('dd')).toHaveText('10')
    await expect(page.getByText(
      'Variable a refers to a Counter object. Its Value property is 10.',
    )).toBeAttached()
    await expect(page.getByText(
      'Variables a and b refer to the same Counter object. Its Value property is 10.',
      { exact: true },
    )).toBeAttached()
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )).toBe(false)
    expect(await sharedModel.getByLabel('C# code', { exact: true }).evaluate((element) =>
      getComputedStyle(element).overflowX,
    )).toBe('auto')
    if (viewport.suffix) {
      const csharpCapture = viewport.width === 375 ? sharedModel.locator('figure').last() : sharedModel
      await csharpCapture.screenshot({
        path: `visual-review/runtime-model-shared-csharp-${viewport.suffix}.png`,
      })
    }

    const mutationModel = models.nth(3)
    await expect(mutationModel.locator('[data-runtime-entity="object"]')).toHaveCount(2)
    await expect(mutationModel.locator('[data-runtime-entity="variable"]')).toHaveCount(4)
    await expect(mutationModel.locator('[data-runtime-changed="true"]')).toHaveCount(1)
    await expect(mutationModel.getByText('object mutated')).toBeVisible()
    await expect(mutationModel.getByText(/still refer to the same Counter object/)).toBeAttached()
    if (viewport.suffix) {
      await mutationModel.screenshot({
        path: `visual-review/runtime-model-mutation-csharp-${viewport.suffix}.png`,
      })
    }

    const splitModel = models.nth(4)
    const splitAfter = splitModel.locator('[data-runtime-topology="split-target"]')
    await expect(splitModel.locator('[data-runtime-entity="object"]')).toHaveCount(3)
    await expect(splitAfter.locator('[data-runtime-object-identity="original"]')).toHaveCount(1)
    await expect(splitAfter.locator('[data-runtime-object-identity="new"]')).toHaveCount(1)
    await expect(splitAfter.locator('[data-runtime-relationship-changed="true"]')).toHaveCount(1)
    await expect(splitModel.getByText('relationship changed')).toBeVisible()
    await expect(splitModel.getByText('changed target')).toBeVisible()
    await expect(splitModel.getByText(/a still refers to the original Counter object/)).toBeAttached()
    if (viewport.suffix) {
      await splitModel.screenshot({
        path: `visual-review/runtime-model-reassignment-csharp-${viewport.suffix}.png`,
      })
    }

    await page.getByRole('radio', { name: 'Python' }).click()
    const pythonShared = page.getByRole('region', { name: 'Python runtime model' }).nth(2)
    await expect(pythonShared.locator('[data-runtime-entity="name"]')).toHaveCount(2)
    await expect(pythonShared.locator('[data-runtime-entity="object"]')).toHaveCount(1)
    await expect(pythonShared.locator('dd')).toHaveText('10')
    await expect(page.getByText(
      'The names a and b are bound to the same Counter object. Its value field is 10.',
      { exact: true },
    )).toBeAttached()
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )).toBe(false)
    if (viewport.suffix) {
      const pythonCapture = viewport.width === 375 ? pythonShared.locator('figure').last() : pythonShared
      await pythonCapture.screenshot({
        path: `visual-review/runtime-model-shared-python-${viewport.suffix}.png`,
      })
      await page.getByRole('region', { name: 'Python runtime model' }).nth(3).screenshot({
        path: `visual-review/runtime-model-mutation-python-${viewport.suffix}.png`,
      })
      const pythonSplit = page.getByRole('region', { name: 'Python runtime model' }).nth(4)
      await expect(pythonSplit.locator('[data-runtime-entity="name"]')).toHaveCount(4)
      await expect(pythonSplit.getByText(/a remains bound to the original Counter object/)).toBeAttached()
      await pythonSplit.screenshot({
        path: `visual-review/runtime-model-rebinding-python-${viewport.suffix}.png`,
      })
    }
  }
})

test('desktop writing tracks active headings, direct hashes, history, tabs, copy, and review states', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://127.0.0.1:4174',
  })
  await page.setViewportSize({ width: 1536, height: 864 })
  await page.goto(writingPath)

  await expect(page.getByRole('heading', { level: 1, name: 'Technical writing framework preview' })).toBeVisible()
  await expect(page.getByText('ARTICLE', { exact: true })).toBeVisible()
  await expect(page.getByText('DRAFT', { exact: true })).toBeVisible()
  await expect(page.getByText('Unpublished draft', { exact: true })).toBeVisible()
  await expect(page.getByText('FRAMEWORK PREVIEW', { exact: true })).toHaveCount(0)
  const contents = page.getByRole('navigation', { name: 'Contents' })
  await expect(contents).toBeVisible()
  await expect(contents.getByRole('link', { name: 'What this fixture checks' })).toHaveAttribute('aria-current', 'location')
  await expect(page.getByRole('button', { name: /Return to this writing's Contents/ })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Related projects' })).toBeAttached()
  await page.screenshot({ path: 'visual-review/1536-writings-framework-top.png', fullPage: false })

  const examplesLink = contents.getByRole('link', { name: 'Equivalent examples', exact: true })
  await examplesLink.click()
  await expect(examplesLink).toHaveAttribute('aria-current', 'location')
  await expect(page).toHaveURL(/#equivalent-examples$/)
  const examplesHeading = page.getByRole('heading', { name: 'Equivalent examples' })
  await expect(examplesHeading).toBeInViewport()
  const headingBox = await examplesHeading.boundingBox()
  expect(headingBox && headingBox.y >= 66 && headingBox.y < 864).toBeTruthy()
  await page.screenshot({ path: 'visual-review/1536-writings-equivalent-examples-active.png', fullPage: false })

  const nestedLink = contents.getByRole('link', { name: 'Graceful preference fallback' })
  await nestedLink.click()
  await expect(nestedLink).toHaveAttribute('aria-current', 'location')
  await expect(page).toHaveURL(/#graceful-preference-fallback$/)

  const finalLink = contents.getByRole('link', { name: 'Portable Markdown elements' })
  await finalLink.click()
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect(finalLink).toHaveAttribute('aria-current', 'location')
  await page.screenshot({ path: 'visual-review/1536-writings-portable-markdown-active.png', fullPage: false })

  await contents.getByRole('link', { name: 'What this fixture checks' }).focus()
  await expect(contents.getByRole('link', { name: 'What this fixture checks' })).toBeFocused()
  await expect(finalLink).toHaveAttribute('aria-current', 'location')

  await page.goBack()
  await expect(page).toHaveURL(/#graceful-preference-fallback$/)
  await expect(nestedLink).toHaveAttribute('aria-current', 'location')
  await page.goBack()
  await expect(page).toHaveURL(/#equivalent-examples$/)
  await expect(examplesLink).toHaveAttribute('aria-current', 'location')

  await page.getByRole('tab', { name: 'Python' }).first().click()
  await expect(page.getByRole('tab', { name: 'Python', selected: true })).toHaveCount(2)
  const visiblePanel = page.getByRole('tabpanel').first()
  await visiblePanel.getByRole('button', { name: 'Copy Python code' }).click()
  await expect(visiblePanel.getByRole('button', { name: 'Copy Python code' })).toContainText('Copied')

  await page.goto(`${writingPath}#equivalent-examples`)
  await expect(examplesLink).toHaveAttribute('aria-current', 'location')
  const directHeadingBox = await examplesHeading.boundingBox()
  expect(directHeadingBox && directHeadingBox.y >= 66 && directHeadingBox.y < 864).toBeTruthy()

  await examplesHeading.evaluate((heading) => window.scrollTo(0, heading.offsetTop + 350))
  await page.getByRole('heading', { name: 'What this fixture checks' }).evaluate((heading) => window.scrollTo(0, heading.offsetTop - 90))
  await expect(contents.getByRole('link', { name: 'What this fixture checks' })).toHaveAttribute('aria-current', 'location')

  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)

  await page.goto('./writings')
  await expect(page.getByRole('heading', { name: 'Latest writings' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'When the Workaround Becomes the Architecture' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Draft previews' })).toBeVisible()
  await page.screenshot({ path: 'visual-review/1536-writings-index.png', fullPage: false })
})

test('mobile Contents control appears only after the TOC, preserves state, and respects reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 767 })
  await page.goto(writingPath)

  const contents = page.getByRole('navigation', { name: 'Contents' })
  const returnButton = page.getByRole('button', { name: /Return to this writing's Contents/ })
  await expect(contents).toBeVisible()
  await expect(returnButton).toHaveCount(0)
  await page.screenshot({ path: 'visual-review/412-writings-contents-visible.png', fullPage: false })

  const examplesHeading = page.getByRole('heading', { name: 'Equivalent examples' })
  await examplesHeading.evaluate((heading) => {
    const top = heading.getBoundingClientRect().top + window.scrollY
    window.scrollTo(0, top - 100)
  })
  const pythonTab = page.getByRole('tab', { name: 'Python' }).first()
  await pythonTab.focus()
  await expect(returnButton).toBeVisible()
  await expect(pythonTab).toBeFocused()
  await expect(contents.getByRole('link', { name: 'Equivalent examples' })).toHaveAttribute('aria-current', 'location')

  const buttonBox = await returnButton.boundingBox()
  const bottomNavBox = await page.getByRole('navigation', { name: 'Mobile primary navigation' }).boundingBox()
  expect(buttonBox && bottomNavBox && buttonBox.y + buttonBox.height < bottomNavBox.y).toBeTruthy()
  await page.screenshot({ path: 'visual-review/412-writings-deep-contents-control.png', fullPage: false })

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => {
    const original = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function (options?: boolean | ScrollIntoViewOptions) {
      ;(window as typeof window & { __contentsScrollBehavior?: ScrollBehavior }).__contentsScrollBehavior =
        typeof options === 'object' ? options.behavior : undefined
      return original.call(this, options)
    }
  })
  await returnButton.click()
  await expect(contents).toBeInViewport()
  await expect(returnButton).toHaveCount(0)
  await expect(contents.getByRole('link', { name: 'Equivalent examples' })).toHaveAttribute('aria-current', 'location')
  expect(await page.evaluate(() => (window as typeof window & { __contentsScrollBehavior?: ScrollBehavior }).__contentsScrollBehavior)).toBe('auto')
  await page.screenshot({ path: 'visual-review/412-writings-after-contents-return.png', fullPage: false })

  await page.getByRole('heading', { name: 'Equivalent examples' }).scrollIntoViewIfNeeded()
  await expect(page.getByRole('tab', { name: 'C#', selected: true })).toBeVisible()
  await page.screenshot({ path: 'visual-review/412-writings-code-tabs.png', fullPage: false })

  await page.goto('./writings')
  await expect(page.getByRole('heading', { name: 'Latest writings' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'When the Workaround Becomes the Architecture' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Draft previews' })).toBeVisible()
  await expect(returnButton).toHaveCount(0)
  await page.screenshot({ path: 'visual-review/412-writings-index.png', fullPage: false })
})

test('standalone plaintext uses the article width, wraps visually, and copies exactly', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://127.0.0.1:4174',
  })
  const expectedPlaintextLines = [
    'When fixing a bug or failing test, do not silently introduce defaults, fallbacks, retries, coercions, ignored errors, or other compensating behavior just to make the code pass.',
    '',
    'If such a workaround appears necessary:',
    '- identify the underlying assumption or contract being violated;',
    '- explain what behavior the workaround changes;',
    '- preserve information about the original failure where relevant;',
    '- make the workaround observable if it may persist;',
    '- distinguish temporary compatibility behavior from the intended system contract;',
    '- do not change a failing test merely to accommodate the workaround unless the intended behavior has been confirmed;',
    '- flag the workaround explicitly before implementing it.',
  ]
  const articleSource = await readFile(
    new URL('../../src/content/writings/published/when-the-workaround-becomes-the-architecture.md', import.meta.url),
    'utf8',
  )
  const plaintextMatch = articleSource.match(
    /## Make the decision explicit\r?\n[\s\S]*?```text\r?\n([\s\S]*?)\r?\n```/,
  )
  const expectedPlaintext = plaintextMatch?.[1].replace(/\r\n?/g, '\n')
  expect(expectedPlaintext).toBeDefined()

  for (const viewport of [
    { width: 1536, height: 864 },
    { width: 375, height: 667 },
    { width: 412, height: 767 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('./writings/when-the-workaround-becomes-the-architecture#make-the-decision-explicit')
    await page.evaluate(() => {
      const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard)
      Object.defineProperty(navigator.clipboard, 'writeText', {
        configurable: true,
        value: async (text: string) => {
          ;(window as typeof window & { __copiedPlaintext?: string }).__copiedPlaintext = text
          return originalWriteText(text)
        },
      })
    })
    const heading = page.getByRole('heading', { name: 'Make the decision explicit' })
    await expect(heading).toBeInViewport()
    const plaintext = page.locator('pre[aria-label="Plain text code"]').filter({
      hasText: 'When fixing a bug or failing test',
    })
    await expect(plaintext).toBeVisible()
    const renderedPlaintext = await plaintext.locator('code').textContent()
    expect(renderedPlaintext?.split(/\r?\n/)).toEqual(expectedPlaintextLines)

    const presentation = await plaintext.evaluate((pre) => {
      const figure = pre.closest('figure')
      const code = pre.querySelector('code')
      if (!figure || !code || !figure.parentElement) throw new Error('Plaintext code structure is missing.')
      const figureStyle = getComputedStyle(figure)
      const preStyle = getComputedStyle(pre)
      const codeStyle = getComputedStyle(code)
      return {
        marginLeft: figureStyle.marginLeft,
        marginRight: figureStyle.marginRight,
        widthDelta: Math.abs(figure.parentElement.clientWidth - figure.getBoundingClientRect().width),
        preOverflowX: preStyle.overflowX,
        preOverflows: pre.scrollWidth > pre.clientWidth,
        whiteSpace: codeStyle.whiteSpace,
        overflowWrap: codeStyle.overflowWrap,
        wordBreak: codeStyle.wordBreak,
        codeWidth: codeStyle.width,
        codeMinWidth: codeStyle.minWidth,
      }
    })

    expect(presentation).toMatchObject({
      marginLeft: '0px',
      marginRight: '0px',
      preOverflowX: 'hidden',
      preOverflows: false,
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
      wordBreak: 'normal',
      codeMinWidth: '0px',
    })
    expect(presentation.widthDelta).toBeLessThanOrEqual(1)
    expect(presentation.codeWidth).not.toBe('max-content')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)

    const copyButton = plaintext.locator('..').getByRole('button', { name: 'Copy Plain text code' })
    await copyButton.click()
    await expect(copyButton).toContainText('Copied')
    expect(await page.evaluate(() => (
      window as typeof window & { __copiedPlaintext?: string }
    ).__copiedPlaintext)).toBe(expectedPlaintext)

    await heading.scrollIntoViewIfNeeded()
    await page.screenshot({
      path: `visual-review/${viewport.width}-workaround-make-decision-plaintext.png`,
      fullPage: false,
    })
  }
})

test('programming blocks and code tabs keep non-wrapping source-code behavior', async ({ page }) => {
  for (const viewport of [
    { width: 375, height: 667 },
    { width: 412, height: 767 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(`${writingPath}#a-normal-fenced-block`)
    const heading = page.getByRole('heading', { name: 'A normal fenced block' })
    await expect(heading).toBeInViewport()
    const source = page.locator('pre[aria-label="JSON code"]')
    await expect(source).toBeVisible()
    const sourcePresentation = await source.evaluate((pre) => {
      const code = pre.querySelector('code')
      if (!code) throw new Error('Source code element is missing.')
      return {
        overflowX: getComputedStyle(pre).overflowX,
        whiteSpace: getComputedStyle(code).whiteSpace,
        width: getComputedStyle(code).width,
      }
    })
    expect(sourcePresentation.overflowX).toBe('auto')
    expect(sourcePresentation.whiteSpace).toBe('pre')
    expect(sourcePresentation.width).not.toBe('auto')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)
    await heading.scrollIntoViewIfNeeded()
    await page.screenshot({
      path: `visual-review/${viewport.width}-framework-normal-source-code.png`,
      fullPage: false,
    })
  }

  await page.goto(`${writingPath}#equivalent-examples`)
  const panel = page.getByRole('tabpanel').first()
  const tabCode = panel.locator('pre[aria-label="C# code"]')
  const tabPresentation = await tabCode.evaluate((pre) => {
    const figure = pre.closest('figure')
    const code = pre.querySelector('code')
    if (!figure || !code) throw new Error('Code-tab structure is missing.')
    return {
      figureMargin: getComputedStyle(figure).margin,
      overflowX: getComputedStyle(pre).overflowX,
      whiteSpace: getComputedStyle(code).whiteSpace,
      width: getComputedStyle(code).width,
    }
  })
  expect(tabPresentation.figureMargin).toBe('0px')
  expect(tabPresentation.overflowX).toBe('auto')
  expect(tabPresentation.whiteSpace).toBe('pre')
  expect(tabPresentation.width).not.toBe('auto')
})

for (const viewport of [
  { width: 360, height: 800 },
  { width: 375, height: 667 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
]) {
  test(`writing remains responsive at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto(`${writingPath}#equivalent-examples`)
    await expect(page.getByRole('heading', { name: 'Equivalent examples' })).toBeInViewport()
    await expect(page.getByRole('navigation', { name: 'Contents' }).getByRole('link', { name: 'Equivalent examples' })).toHaveAttribute('aria-current', 'location')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false)

    if (viewport.width < 768) {
      await page.getByRole('heading', { name: 'Portable Markdown elements' }).scrollIntoViewIfNeeded()
      const control = page.getByRole('button', { name: /Return to this writing's Contents/ })
      await expect(control).toBeVisible()
      const controlBox = await control.boundingBox()
      const navBox = await page.getByRole('navigation', { name: 'Mobile primary navigation' }).boundingBox()
      expect(controlBox && navBox && controlBox.y + controlBox.height < navBox.y).toBeTruthy()
    } else {
      await expect(page.getByRole('button', { name: /Return to this writing's Contents/ })).toHaveCount(0)
    }
  })
}
