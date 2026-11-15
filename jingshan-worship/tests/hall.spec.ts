import { describe, expect, it } from 'vitest'
import { AXIS_HALLS, HALLS, getHall, isHallId } from '@/domain/hall'

describe('中軸殿宇單一真源', () => {
  it('共七座殿宇，其中五座在中軸上', () => {
    expect(HALLS).toHaveLength(7)
    expect(AXIS_HALLS).toHaveLength(5)
    expect(AXIS_HALLS.map((h) => h.axisOrder)).toEqual([0, 1, 2, 3, 4])
  })

  it('最前方山門題五鳳山門（兼天王殿），不再另設天王殿', () => {
    expect(AXIS_HALLS[0].id).toBe('tianwang')
    expect(AXIS_HALLS[0].name).toBe('五鳳山門')
    expect(AXIS_HALLS[0].box.z).toBe(0)
    expect(AXIS_HALLS.some((h) => h.box.z === -24)).toBe(false)
  })

  it('殿名依航拍導覽圖標註', () => {
    expect(AXIS_HALLS.map((h) => h.name)).toEqual([
      '五鳳山門', '釋迦寶殿', '潮音堂', '觀音堂', '凌霄閣',
    ])
    expect(getHall('wenshu').name).toBe('西配院')
    expect(getHall('puxian').name).toBe('東配院')
  })

  it('中軸由前向後 z 遞減，末端凌霄閣位於抬高台地', () => {
    const z = AXIS_HALLS.map((h) => h.box.z)
    expect(z.every((v, i) => i === 0 || v < z[i - 1])).toBe(true)
    expect(AXIS_HALLS.at(-1)?.id).toBe('lingxiao')
    expect(AXIS_HALLS.at(-1)?.box.baseY).toBe(6)
  })

  it('中軸五殿等距 44，全寺進深擴至 176，台上配院跟隨', () => {
    expect(AXIS_HALLS.map((h) => h.box.z)).toEqual([0, -44, -88, -132, -176])
    const gaps = AXIS_HALLS.slice(1).map((h, i) => AXIS_HALLS[i].box.z - h.box.z)
    expect(gaps).toEqual([44, 44, 44, 44])
    expect(getHall('wenshu').box.z).toBe(-176)
    expect(getHall('puxian').box.z).toBe(-176)
  })

  it('兩側宋式兩層樓閣：台上配院包圍盒高度跟隨一層加高 + 二層', () => {
    expect(getHall('wenshu').box.height).toBe(16.5)
    expect(getHall('puxian').box.height).toBe(16.5)
    expect(getHall('wenshu').box.height).toBeGreaterThan(getHall('lingxiao').box.height - 4)
  })

  it('查表與型別守衛行為一致', () => {
    expect(getHall('guanyin').name).toBe('觀音堂')
    expect(isHallId('tianwang')).toBe(true)
    expect(isHallId('shanmen')).toBe(false)
    expect(() => getHall('shanmen' as never)).toThrow('未知殿宇')
  })
})
