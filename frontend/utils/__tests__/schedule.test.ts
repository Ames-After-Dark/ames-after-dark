import { isBarOpen } from '../schedule';

describe('isBarOpen', () => {
  it('returns true for a bar open during the same-day window', () => {
    const now = new Date('2026-05-02T18:00:00');

    expect(
      isBarOpen(
        {
          openingTime: '4:00 PM',
          closingTime: '11:00 PM',
          status: 'Closed',
        },
        now
      )
    ).toBe(true);
  });

  it('returns true for an overnight window that spans midnight', () => {
    const now = new Date('2026-05-02T01:00:00');

    expect(
      isBarOpen(
        {
          openingTime: '4:00 PM',
          closingTime: '2:00 AM',
          status: 'Closed',
        },
        now
      )
    ).toBe(true);
  });

  it('falls back to the bar status when hours are missing', () => {
    const now = new Date('2026-05-02T12:00:00');

    expect(
      isBarOpen(
        {
          status: 'Open',
        },
        now
      )
    ).toBe(true);
  });
});