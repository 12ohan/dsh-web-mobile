// Dual-generation sessions shape (audit doc §10.1): rc.2 carries
// SessionListState.current, a2 removed it (open/clear too) and moved
// selection to per-session retainedBy counters. The helpers must read both
// shapes so the plugin stays compile-green on rc.2 typings and runs green on
// an a2 host.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { currentSessionIdOf, sessionsCanClear, sessionsCanOpen } from '../src/client/core/sessions-compat.ts'

test('currentSessionIdOf reads the rc.2 current field first', () => {
  assert.equal(currentSessionIdOf({ current: 's1', byId: {} }), 's1')
})

test('currentSessionIdOf derives from a2 retainedBy.mainView when current is gone', () => {
  const a2 = {
    byId: {
      a: { id: 'a', retainedBy: { mainView: 0 } },
      b: { id: 'b', retainedBy: { mainView: 2 } },
    },
  }
  assert.equal(currentSessionIdOf(a2), 'b')
})

test('currentSessionIdOf returns undefined on empty, foreign and null shapes', () => {
  assert.equal(currentSessionIdOf({}), undefined)
  assert.equal(currentSessionIdOf({ byId: { a: { id: 'a', retainedBy: { mainView: 0 } } } }), undefined)
  assert.equal(currentSessionIdOf(null), undefined)
  assert.equal(currentSessionIdOf('nope'), undefined)
})

test('sessionsCanClear / sessionsCanOpen feature-detect the a2 removals', () => {
  assert.equal(sessionsCanClear({ clear: () => {} }), true)
  assert.equal(sessionsCanClear({}), false)
  assert.equal(sessionsCanClear(null), false)
  assert.equal(sessionsCanOpen({ open: (id: string) => id }), true)
  assert.equal(sessionsCanOpen({}), false)
})
