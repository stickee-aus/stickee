// Validates saved read-only browser measurements; recapture JSON after UI changes.
// This checks evidence, not a substitute for loading the current page in a browser.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'))
const { beforeDesktop, beforeMobile, afterDesktop, afterMobile } = read('./measurements.json')
function checkLayout(measurement) {
  assert.equal(measurement.scrollWidth, measurement.viewport[0], 'horizontal overflow')
  assert.equal(measurement.snap, 'none', 'mandatory snapping')
  assert.equal(measurement.sections.length, 6)
  for (const section of measurement.sections) {
    assert.equal(section.overflow, 'visible', 'section clips content')
    assert(section.height >= parseFloat(section.minHeight))
  }
}
for (const [before, after, width, height] of [
  [beforeDesktop, afterDesktop, 1440, 900],
  [beforeMobile, afterMobile, 390, 844],
]) {
  assert.deepEqual(after.viewport, [width, height])
  assert.equal(before.text, after.text, 'homepage content changed')
  assert.deepEqual(before.links, after.links, 'destinations changed')
  checkLayout(after)
  assert.equal(after.sections[0].height + after.header, height)
  const content = after.sections.slice(1)
  assert(content.every(s => s.x === content[0].x && s.width === content[0].width))
  assert(after.sections.slice(2, 5).every(s => s.minHeight === '0px'))
}
assert.equal(afterDesktop.sections[1].height, 0.8 * afterDesktop.viewport[1])
assert.equal(afterDesktop.sections[5].height, 0.8 * afterDesktop.viewport[1])
assert.equal(afterMobile.sections[1].minHeight, '0px')
const stress = read('./stress-measurements.json')
assert.equal(stress.length, 3)
for (const measurement of stress) {
  checkLayout(measurement)
  assert.deepEqual(measurement.clips, [])
}
assert(stress.some(m => m.sections[0].height > parseFloat(m.sections[0].minHeight)), 'growth not exercised')
// Negative controls prove the checks reject overflow and clipping evidence.
assert.throws(() => checkLayout({ ...afterMobile, scrollWidth: 500 }))
assert.throws(() => checkLayout({ ...afterMobile, sections: afterMobile.sections.map(s => ({ ...s, overflow: 'hidden' })) }))
console.log('HOMEPAGE_MEASUREMENTS_PASS')
