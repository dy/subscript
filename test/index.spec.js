// @ts-check
import { test, expect } from '@playwright/test'

const URL = 'http://localhost:8765/'

test.describe('Subscript REPL', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(URL)
    // Wait for AST to be populated (means worker is ready and compiled)
    await expect(page.locator('#ast')).not.toBeEmpty({ timeout: 5000 })
  })

  test('no console errors on load', async ({ page }) => {
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', err => {
      errors.push(err.message)
    })
    await page.goto(URL)
    await expect(page.locator('#ast')).not.toBeEmpty({ timeout: 5000 })
    // Filter out expected startup logs, only check for real errors
    const realErrors = errors.filter(e => !e.includes('=== PAGE STARTUP ==='))
    expect(realErrors, `Console errors found: ${realErrors.join(', ')}`).toEqual([])
  })

  test('compiles expression on load', async ({ page }) => {
    const ast = page.locator('#ast')
    await expect(ast).not.toBeEmpty()
  })

  test('runs expression with Run button', async ({ page }) => {
    const evalTab = page.locator('.output-tab[data-tab="eval"]')
    const runBtn = page.locator('#runBtn')
    const result = page.locator('[data-testid="result"]')

    await evalTab.click()
    await runBtn.click()
    await expect(result).not.toBeEmpty({ timeout: 2000 })
  })

  test('shows eval time after run', async ({ page }) => {
    const evalTab = page.locator('.output-tab[data-tab="eval"]')
    const runBtn = page.locator('#runBtn')
    const evalTime = page.locator('#evalTime')

    await evalTab.click()
    await runBtn.click()
    await expect(evalTime).toContainText('ms', { timeout: 2000 })
  })

  test('updates compile on input change', async ({ page }) => {
    const input = page.locator('#input')
    const ast = page.locator('#ast')

    await input.fill('1 + 2')
    await expect(ast).not.toBeEmpty({ timeout: 2000 })
  })

  test('shows error for invalid syntax', async ({ page }) => {
    const input = page.locator('#input')
    const error = page.locator('#error')

    await input.fill('1 +')
    await expect(error).not.toBeEmpty({ timeout: 2000 })
  })

  test('uses context in evaluation', async ({ page }) => {
    const evalTab = page.locator('.output-tab[data-tab="eval"]')
    const input = page.locator('#input')
    const context = page.locator('#context')
    const result = page.locator('[data-testid="result"]')
    const runBtn = page.locator('#runBtn')

    await evalTab.click()
    await input.fill('a + b')
    await context.fill('{"a": 5, "b": 3}')
    await runBtn.click()
    await expect(result).toHaveText('8', { timeout: 2000 })
  })

  test('minimal preset restricts parser', async ({ page }) => {
    const preset = page.locator('[data-testid="preset"]')
    const input = page.locator('#input')
    const error = page.locator('#error')
    const ast = page.locator('#ast')

    // Minimal doesn't have arrow functions
    await preset.selectOption('minimal')
    await input.fill('x => x + 1')
    await expect(error).not.toBeEmpty({ timeout: 2000 })

    // But simple math compiles
    await input.fill('1 + 2 * 3')
    await expect(ast).not.toBeEmpty({ timeout: 2000 })
    await expect(error).toBeEmpty()
  })

  test('justin preset supports arrows', async ({ page }) => {
    const evalTab = page.locator('.output-tab[data-tab="eval"]')
    const preset = page.locator('[data-testid="preset"]')
    const input = page.locator('#input')
    const ast = page.locator('#ast')
    const result = page.locator('[data-testid="result"]')
    const runBtn = page.locator('#runBtn')

    await preset.selectOption('justin')
    await input.fill('[1,2,3].map(x => x * 2)')
    await expect(ast).not.toBeEmpty({ timeout: 2000 })
    await evalTab.click()
    await runBtn.click()
    await expect(result).toHaveText('[2,4,6]', { timeout: 2000 })
  })

  test('switching presets updates example and recompiles', async ({ page }) => {
    const preset = page.locator('[data-testid="preset"]')
    const input = page.locator('#input')
    const ast = page.locator('#ast')
    const error = page.locator('#error')

    // Switch to minimal - example should update and compile
    await preset.selectOption('minimal')
    await expect(ast).not.toBeEmpty({ timeout: 2000 })
    await expect(error).toBeEmpty()

    // Minimal example should be simple math (no arrows)
    const minimalCode = await input.inputValue()
    expect(minimalCode).not.toContain('=>')

    // Switch to full - should compile without 'token already declared' error
    await preset.selectOption('full')
    await expect(ast).not.toBeEmpty({ timeout: 5000 })
    await expect(error).toBeEmpty({ timeout: 3000 })

    // Switch to justin - example updates with more features
    await preset.selectOption('justin')
    await expect(ast).not.toBeEmpty({ timeout: 5000 })
    await expect(error).toBeEmpty({ timeout: 3000 })

    // Justin example may use arrows
    const justinCode = await input.inputValue()
    expect(justinCode.length).toBeGreaterThan(0)
  })

  test('tabs switch between Tree and Eval', async ({ page }) => {
    const evalTab = page.locator('.output-tab[data-tab="eval"]')
    const treeTab = page.locator('.output-tab[data-tab="tree"]')
    const evalPanel = page.locator('#evalPanel')
    const treePanel = page.locator('#treePanel')

    // Tree tab active by default
    await expect(treeTab).toHaveClass(/active/)
    await expect(treePanel).toHaveClass(/active/)
    await expect(evalTab).not.toHaveClass(/active/)
    await expect(evalPanel).not.toHaveClass(/active/)

    // Click Eval tab
    await evalTab.click()
    await expect(evalTab).toHaveClass(/active/)
    await expect(evalPanel).toHaveClass(/active/)
    await expect(treeTab).not.toHaveClass(/active/)
    await expect(treePanel).not.toHaveClass(/active/)

    // Click Tree tab
    await treeTab.click()
    await expect(treeTab).toHaveClass(/active/)
    await expect(treePanel).toHaveClass(/active/)
  })

  test('sidebar toggles', async ({ page }) => {
    const toggle = page.locator('#toggleSidebar')
    const sidebar = page.locator('#sidebar')

    await expect(sidebar).not.toHaveClass(/collapsed/)
    await toggle.click()
    await expect(sidebar).toHaveClass(/collapsed/)
    await toggle.click()
    await expect(sidebar).not.toHaveClass(/collapsed/)
  })

  test('feature checkbox changes parser and updates example', async ({ page }) => {
    const input = page.locator('#input')
    const ast = page.locator('#ast')
    const errorEl = page.locator('#error')

    // Uncheck arrow feature - example updates to one without arrows
    const arrowCheckbox = page.locator('input[data-id="arrow"]')
    await arrowCheckbox.uncheck()
    
    // Wait for example to update (should not contain arrows anymore)
    await expect(input).not.toHaveValue(/=>/, { timeout: 3000 })
    await expect(ast).not.toBeEmpty({ timeout: 2000 })

    // Verify no arrows in updated code (feature combinator adapts)
    const noArrowCode = await input.inputValue()
    expect(noArrowCode).not.toContain('=>')

    // Re-enable arrow - should compile successfully (may or may not use arrows in example)
    await arrowCheckbox.check()
    await expect(ast).not.toBeEmpty({ timeout: 3000 })
    // No error means arrow syntax is supported again
    await expect(errorEl).toBeEmpty()
  })

  test('line numbers update with input', async ({ page }) => {
    const input = page.locator('#input')
    const lineNums = page.locator('#lineNums')

    await input.fill('a\nb\nc')
    await expect(lineNums).toHaveText('1\n2\n3')
  })

  test('bundle modal opens and closes', async ({ page }) => {
    const getBundleBtn = page.locator('#getBundleBtn')
    const modal = page.locator('#bundleModal')

    await expect(modal).not.toHaveClass(/open/)
    await getBundleBtn.click()
    await expect(modal).toHaveClass(/open/)
    // Click outside to close (no close button)
    await modal.click({ position: { x: 10, y: 10 } })
    await expect(modal).not.toHaveClass(/open/)
  })

  test('bundle toggle produces minified bundle', async ({ page }) => {
    const getBundleBtn = page.locator('#getBundleBtn')
    const bundleToggle = page.locator('#bundleToggle')
    const modalCode = page.locator('#modalCode')
    const sizeInfo = page.locator('#sizeInfo')

    await getBundleBtn.click()

    // Default is imports mode
    const importCode = await modalCode.textContent()
    expect(importCode).toContain('import')

    // Enable bundle+min - should produce minified bundle
    await bundleToggle.check()
    // Wait for minification (shows "Bundling & minifying..." first)
    await expect(modalCode).not.toContainText('Bundling', { timeout: 5000 })
    const bundleCode = await modalCode.textContent()

    // Minified code should not have multi-char whitespace or comments
    expect(bundleCode).not.toMatch(/\n\s*\n/)
    // Should export parse/compile
    expect(bundleCode).toContain('export')

    // Size info should show something
    await expect(sizeInfo).not.toBeEmpty()
  })

  test('size info shows raw and gzip', async ({ page }) => {
    const getBundleBtn = page.locator('#getBundleBtn')
    const sizeInfo = page.locator('#sizeInfo')
    const bundleToggle = page.locator('#bundleToggle')

    await getBundleBtn.click()
    await bundleToggle.check()

    // Should show both raw and gzip sizes
    await expect(sizeInfo).toContainText('gzip', { timeout: 2000 })
    const text = await sizeInfo.textContent()
    expect(text).toMatch(/\d+(\.\d+)?\s*(B|KB)\s*\/\s*\d+(\.\d+)?\s*(B|KB)\s*gzip/)
  })

  test('shows clear error for unsupported syntax', async ({ page }) => {
    const input = page.locator('#input')
    const error = page.locator('#error')

    // 'const' requires var feature (jessie preset)
    await input.fill('const x = 1')
    await expect(error).toContainText('Unexpected', { timeout: 2000 })

    // Error should show position indicator
    const errorText = await error.textContent()
    expect(errorText).toMatch(/at \d+:\d+/)
  })

  test('parses complex JS code with full preset', async ({ page }) => {
    const preset = page.locator('[data-testid="preset"]')
    const input = page.locator('#input')
    const error = page.locator('#error')
    const ast = page.locator('#ast')

    // Select full preset
    await preset.selectOption('full')
    await expect(ast).not.toBeEmpty({ timeout: 5000 })

    // Test parsing subscript.js-like code (imports, const, functions, template literals, sparse arrays)
    const testCode = `
import './feature/number.js';
import { parse, compile } from './parse.js';
export * from './parse.js';

const cache = new WeakMap();

const subscript = (strings, ...values) =>
  typeof strings === 'string' ? compile(parse(strings)) :
  cache.get(strings) || cache.set(strings, compileTemplate(strings, values)).get(strings);

// Sparse array literal [, v] - tests elision handling
const wrap = v => [, v];

const isAST = v =>
  typeof v === 'string' ||
  (Array.isArray(v) && (typeof v[0] === 'string' || v[0] === undefined));

export default subscript;
`.trim()

    await input.fill(testCode)
    await page.waitForTimeout(500)

    // Should parse without errors
    const errorText = await error.textContent()
    expect(errorText, `Full preset failed to parse: ${errorText}`).toBe('')

    // AST should be populated
    await expect(ast).not.toBeEmpty({ timeout: 3000 })
  })

  // Comprehensive feature toggle test - ensures each feature can be enabled without errors
  test.describe('Feature toggles', () => {
    // Features that appear in the REPL sidebar (matching the FEATURES groups)
    const features = [
      // Core
      'number', 'string', 'group', 'access',
      // Operators
      'assign', 'arithmetic', 'logical', 'bit', 'cmp', 'equality', 'increment', 'pow',
      // Advanced Ops
      'ternary', 'arrow', 'optional', 'spread', 'unary', 'identity', 'nullish',
      // Literals
      'literal', 'collection', 'template', 'regex', 'unit', 'comment',
      // Control
      'block', 'if', 'loop', 'switch', 'var', 'destruct', 'try',
      // Functions
      'function', 'async', 'class', 'accessor', 'module', 'asi'
    ]

    for (const feature of features) {
      test(`enabling ${feature} compiles without error`, async ({ page }) => {
        const preset = page.locator('[data-testid="preset"]')
        const errorEl = page.locator('#error')
        const ast = page.locator('#ast')
        const input = page.locator('#input')

        // Start from minimal preset
        await preset.selectOption('minimal')
        await expect(ast).not.toBeEmpty({ timeout: 3000 })
        await expect(errorEl).toBeEmpty()

        // Enable the feature
        const checkbox = page.locator(`input[data-id="${feature}"]`)
        if (await checkbox.isVisible()) {
          const wasChecked = await checkbox.isChecked()
          if (!wasChecked) {
            await checkbox.check()
          }

          // Wait for worker rebuild
          await page.waitForTimeout(500)

          // Set simple input AFTER enabling feature (updateExample() overwrites input)
          await input.fill('1 + 2')
          await page.waitForTimeout(300)

          // Check for worker errors in error element
          const error = await errorEl.textContent()
          expect(error, `Feature ${feature} caused error: ${error}`).toBe('')

          // AST should still be populated
          await expect(ast).not.toBeEmpty({ timeout: 3000 })
        }
      })
    }

    test('all features can be enabled together (full preset)', async ({ page }) => {
      const preset = page.locator('[data-testid="preset"]')
      const errorEl = page.locator('#error')
      const ast = page.locator('#ast')
      const input = page.locator('#input')

      // Select full preset first (this triggers updateExample)
      await preset.selectOption('full')
      // Wait for preset to compile and show AST
      await expect(ast).not.toBeEmpty({ timeout: 5000 })

      // Then override with simple input that definitely works
      await input.fill('1 + 2 * 3')
      // Wait for new compile
      await expect(ast).not.toBeEmpty({ timeout: 5000 })

      const error = await errorEl.textContent()
      expect(error, `Full preset caused error: ${error}`).toBe('')
    })

    test('cycling through all presets produces no errors', async ({ page }) => {
      const preset = page.locator('[data-testid="preset"]')
      const errorEl = page.locator('#error')
      const ast = page.locator('#ast')
      const input = page.locator('#input')

      const presets = ['minimal', 'justin', 'jessie', 'full']

      for (const p of presets) {
        // Select preset first (this triggers updateExample)
        await preset.selectOption(p)
        // Wait for preset example to compile
        await expect(ast).not.toBeEmpty({ timeout: 5000 })

        // Then override with simple input
        await input.fill('1 + 2')
        // Wait for AST to contain the parsed result (not empty, and contains binary)
        await expect(ast).toContainText(/\[|binary|BinaryExpression/, { timeout: 5000 })

        const error = await errorEl.textContent()
        expect(error, `Preset ${p} caused error: ${error}`).toBe('')
      }
    })
  })

})
