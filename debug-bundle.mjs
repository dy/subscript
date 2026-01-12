import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

// Capture console messages
const consoleLogs = []
page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`))

// Navigate to REPL
await page.goto('http://localhost:8765/repl.html', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000) // Wait for init

// Enable bundle toggle and click get bundle
try {
  const toggle = await page.$('#bundleToggle')
  if (toggle) {
    await toggle.check()
    await page.waitForTimeout(500)
  }
  
  const btn = await page.$('#getBundleBtn')
  if (btn) {
    await btn.click()
    await page.waitForTimeout(2000)
  }
} catch (e) {
  console.log('Error interacting with page:', e.message)
}

// Print all console logs
console.log('\n=== CONSOLE OUTPUT ===')
consoleLogs.forEach(log => console.log(log))

// Get the modal code content (what bundle was generated)
try {
  const modalText = await page.textContent('#modalCode')
  if (modalText && modalText.length > 0) {
    // Just show first 3000 chars to see structure
    console.log('\n=== BUNDLE (first 3000 chars) ===')
    console.log(modalText.slice(0, 3000))
    
    // Find where "parse" appears
    console.log('\n=== PARSE DECLARATIONS ===')
    const lines = modalText.split('\n')
    let parseCount = 0
    lines.forEach((line, i) => {
      if (/\bparse\s*[=\(]|^parse|function parse|const parse|let parse|var parse/.test(line)) {
        parseCount++
        console.log(`Line ${i}: ${line.trim().slice(0, 100)}`)
        if (parseCount > 10) console.log('... (more matches)')
      }
    })
  }
} catch (e) {
  console.log('Error getting modal text:', e.message)
}

await browser.close()
console.log('\n✓ Debug complete')

