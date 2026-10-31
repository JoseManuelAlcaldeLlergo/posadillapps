import { resolvePeriod } from '../period';

describe('resolvePeriod', () => {
  describe('date range', () => {
    it('accepts ordered dates, including a single day', () => {
      expect(resolvePeriod({ type: 'dateRange', from: '2025-01-01', to: '2025-03-31' })).toEqual({
        ok: true,
        period: { from: '2025-01-01', to: '2025-03-31' },
      });
      expect(resolvePeriod({ type: 'dateRange', from: '2025-01-01', to: '2025-01-01' }).ok).toBe(true);
    });

    it('rejects missing or reversed dates', () => {
      expect(resolvePeriod({ type: 'dateRange', from: '2025-01-01', to: null })).toEqual({
        ok: false,
        reason: 'incomplete',
      });
      expect(resolvePeriod({ type: 'dateRange', from: '2025-02-01', to: '2025-01-31' })).toEqual({
        ok: false,
        reason: 'reversed',
      });
    });
  });

  describe('year range', () => {
    it('accepts ordered years, including a single year', () => {
      expect(resolvePeriod({ type: 'yearRange', from: '2013', to: ' 2014 ' })).toEqual({
        ok: true,
        period: { fromYear: 2013, toYear: 2014 },
      });
      expect(resolvePeriod({ type: 'yearRange', from: '2013', to: '2013' })).toEqual({
        ok: true,
        period: { fromYear: 2013, toYear: 2013 },
      });
    });

    it('rejects missing, invalid or reversed years', () => {
      expect(resolvePeriod({ type: 'yearRange', from: '2013', to: ' ' })).toEqual({
        ok: false,
        reason: 'incomplete',
      });
      expect(resolvePeriod({ type: 'yearRange', from: '201', to: '2014' })).toEqual({
        ok: false,
        reason: 'invalidYear',
      });
      expect(resolvePeriod({ type: 'yearRange', from: '2015', to: '2014' })).toEqual({
        ok: false,
        reason: 'reversed',
      });
    });
  });
});
