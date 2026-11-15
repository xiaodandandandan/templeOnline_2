import { describe, expect, it } from 'vitest'
import { anchorsOf, INTERIOR_PROP_LABELS, type InteriorAnchor } from '@/domain/interior'

const sample: InteriorAnchor[] = [
  { hallId: 'tianwang', kind: 'statue', x: 0, y: 1.7, z: -3 },
  { hallId: 'tianwang', kind: 'cushion', x: -2.7, y: 1.1, z: -1.6, yaw: 0, seat: 1 },
  { hallId: 'tianwang', kind: 'cushion', x: 2.7, y: 1.1, z: -1.6 },
  { hallId: 'shijia', kind: 'altar', x: 0, y: 1.6, z: -53 },
]

describe('室內預留錨點', () => {
  it('按殿宇與類型篩選，座標保持世界值', () => {
    expect(anchorsOf(sample, 'tianwang')).toHaveLength(3)
    expect(anchorsOf(sample, 'tianwang', 'cushion')).toHaveLength(2)
    expect(anchorsOf(sample, 'shijia', 'cushion')).toHaveLength(0)
    expect(anchorsOf(sample, 'tianwang', 'statue')[0].y).toBe(1.7)
  })

  it('八類錨點均有後續交互所需的標籤', () => {
    expect(Object.keys(INTERIOR_PROP_LABELS).sort()).toEqual(
      ['altar', 'beads', 'cushion', 'incense', 'lantern', 'moktak', 'mural', 'statue'],
    )
  })

  it('蒲團錨點攜帶面朝主尊的朝向與座號', () => {
    const seat = anchorsOf(sample, 'tianwang', 'cushion')[0]
    expect(seat.yaw).toBe(0)
    expect(seat.seat).toBe(1)
  })
})
