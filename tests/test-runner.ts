type TestFn = () => void | Promise<void>

type TestCase = {
  name: string
  fn: TestFn
}

type TestSuite = {
  name: string
  tests: TestCase[]
}

const suites: TestSuite[] = []
let currentSuite: TestSuite | null = null

export function describe(name: string, fn: () => void) {
  const suite: TestSuite = { name, tests: [] }
  currentSuite = suite
  suites.push(suite)
  fn()
  currentSuite = null
}

export function test(name: string, fn: TestFn) {
  if (!currentSuite) {
    throw new Error('test() must be called inside describe()')
  }
  currentSuite.tests.push({ name, fn })
}

export function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but received ${JSON.stringify(actual)}`)
      }
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected deep equality with ${JSON.stringify(expected)}, but received ${JSON.stringify(actual)}`)
      }
    },
  }
}

export async function runSuites() {
  console.log('\n======================================================')
  console.log('🧪 Physics Academy Automated Test Suite (Testing Division)')
  console.log('======================================================\n')

  let total = 0
  let passed = 0
  let failed = 0
  const startTime = Date.now()

  for (const suite of suites) {
    console.log(`\x1b[1m\x1b[36m▶ ${suite.name}\x1b[0m`)
    for (const t of suite.tests) {
      total++
      try {
        await t.fn()
        passed++
        console.log(`  \x1b[32m✔\x1b[0m ${t.name}`)
      } catch (err: any) {
        failed++
        console.log(`  \x1b[31m✘ ${t.name}\x1b[0m`)
        console.log(`    \x1b[33mError: ${err?.message || err}\x1b[0m`)
      }
    }
    console.log('')
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  console.log('------------------------------------------------------')
  console.log(`Summary: \x1b[32m${passed} passed\x1b[0m, \x1b[${failed > 0 ? '31' : '32'}m${failed} failed\x1b[0m, ${total} total (${duration}s)`)
  console.log('------------------------------------------------------\n')

  if (failed > 0) {
    process.exit(1)
  }
}
