import { describe, expect, it } from 'vitest'
import { anchorsOf, INTERIOR_PROP_LABELS, type InteriorAnchor } from '@/domain/interior'

const sample: InteriorAnchor[] = [
  { hallId: 'tianwang', kind: 'statue', x: 0, y: 1.7, z: -3 },
  { hallId: 'tianwang', kind: 'cushion', x: -2.7, y: 1.1, z: -1.6, yaw: 0, seat: 1 },
  { hallId: 'tianwang', kind: 'cushion', x: 2.7, y: 1.1, z: -1.6 },
  { hallId: 'shijia', kind: 'altar', x: 0, y: 1.6, z: -53 },
]

describe('室内预留锚点', () => {
  it('按殿宇与类型筛选，座标保持世界值', () => {
    expect(anchorsOf(sample, 'tianwang')).toHaveLength(3)
    expect(anchorsOf(sample, 'tianwang', 'cushion')).toHaveLength(2)
    expect(anchorsOf(sample, 'shijia', 'cushion')).toHaveLength(0)
    expect(anchorsOf(sample, 'tianwang', 'statue')[0].y).toBe(1.7)
  })

  it('八类锚点均有后续交互所需的标签', () => {
    expect(Object.keys(INTERIOR_PROP_LABELS).sort()).toEqual(
      ['altar', 'beads', 'cushion', 'incense', 'lantern', 'moktak', 'mural', 'statue'],
    )
  })

  it('蒲团锚点携带面朝主尊的朝向与座号', () => {
    const seat = anchorsOf(sample, 'tianwang', 'cushion')[0]
    expect(seat.yaw).toBe(0)
    expect(seat.seat).toBe(1)
  })
})
