import { describe, expect, it } from 'vitest'
import { AXIS_HALLS, HALLS, getHall, isHallId } from '@/domain/hall'

describe('中轴殿宇单一真源', () => {
  it('共七座殿宇，其中五座在中轴上', () => {
    expect(HALLS).toHaveLength(7)
    expect(AXIS_HALLS).toHaveLength(5)
    expect(AXIS_HALLS.map((h) => h.axisOrder)).toEqual([0, 1, 2, 3, 4])
  })

  it('最前方山门题五凤山门（兼天王殿），不再另设天王殿', () => {
    expect(AXIS_HALLS[0].id).toBe('tianwang')
    expect(AXIS_HALLS[0].name).toBe('五凤山门')
    expect(AXIS_HALLS[0].box.z).toBe(0)
    expect(AXIS_HALLS.some((h) => h.box.z === -24)).toBe(false)
  })

  it('殿名依航拍导览图标注', () => {
    expect(AXIS_HALLS.map((h) => h.name)).toEqual([
      '五凤山门', '释迦宝殿', '潮音堂', '观音堂', '凌霄阁',
    ])
    expect(getHall('wenshu').name).toBe('西配院')
    expect(getHall('puxian').name).toBe('东配院')
  })

  it('中轴由前向后 z 递减，末端凌霄阁位于抬高台地', () => {
    const z = AXIS_HALLS.map((h) => h.box.z)
    expect(z.every((v, i) => i === 0 || v < z[i - 1])).toBe(true)
    expect(AXIS_HALLS.at(-1)?.id).toBe('lingxiao')
    expect(AXIS_HALLS.at(-1)?.box.baseY).toBe(6)
  })

  it('中轴五殿等距 44，全寺进深扩至 176，台上配院跟随', () => {
    expect(AXIS_HALLS.map((h) => h.box.z)).toEqual([0, -44, -88, -132, -176])
    const gaps = AXIS_HALLS.slice(1).map((h, i) => AXIS_HALLS[i].box.z - h.box.z)
    expect(gaps).toEqual([44, 44, 44, 44])
    expect(getHall('wenshu').box.z).toBe(-176)
    expect(getHall('puxian').box.z).toBe(-176)
  })

  it('两侧宋式两层楼阁：台上配院包围盒高度跟随一层加高 + 二层', () => {
    expect(getHall('wenshu').box.height).toBe(16.5)
    expect(getHall('puxian').box.height).toBe(16.5)
    expect(getHall('wenshu').box.height).toBeGreaterThan(getHall('lingxiao').box.height - 4)
  })

  it('查表与型别守卫行为一致', () => {
    expect(getHall('guanyin').name).toBe('观音堂')
    expect(isHallId('tianwang')).toBe(true)
    expect(isHallId('shanmen')).toBe(false)
    expect(() => getHall('shanmen' as never)).toThrow('未知殿宇')
  })
})
