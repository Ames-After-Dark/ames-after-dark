import { calculateDistance, formatLastActive } from '../location-utils';

describe('location-utils', () => {
  describe('formatLastActive', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-05-02T12:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('returns just now for a recent timestamp', () => {
      expect(formatLastActive('2026-05-02T11:59:45Z')).toBe('just now');
    });

    it('returns a minute-based label for older timestamps', () => {
      expect(formatLastActive('2026-05-02T11:48:00Z')).toBe('12m ago');
    });

    it('handles invalid or future timestamps safely', () => {
      expect(formatLastActive('not-a-date')).toBe('unknown');
      expect(formatLastActive('2026-05-02T13:00:00Z')).toBe('just now');
    });
  });

  describe('calculateDistance', () => {
    it('returns zero for identical coordinates', () => {
      expect(calculateDistance(42.0, -93.0, 42.0, -93.0)).toBeCloseTo(0, 5);
    });

    it('returns a positive distance for different coordinates', () => {
      const distance = calculateDistance(42.0, -93.0, 42.001, -93.001);
      expect(distance).toBeGreaterThan(0);
    });
  });
});