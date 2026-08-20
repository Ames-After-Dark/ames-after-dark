import { renderHook, waitFor } from '@testing-library/react-native';

import { useBars } from '../useBars';
import { getBars } from '@/services/barsService';

jest.mock('@/services/barsService', () => ({
  getBars: jest.fn(),
}));

jest.mock('@/utils/schedule', () => {
  const actual = jest.requireActual('@/utils/schedule');

  return {
    ...actual,
    getNow: jest.fn(() => new Date('2026-05-02T18:00:00')),
  };
});

describe('useBars', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads bars and marks which ones are open now', async () => {
    (getBars as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'Open Bar',
        description: 'Open tonight',
        location_type_id: 1,
        openingTime: '4:00 PM',
        closingTime: '11:00 PM',
        status: 'Closed',
      },
      {
        id: '2',
        name: 'Closed Bar',
        description: 'Closed tonight',
        location_type_id: 1,
        openingTime: '8:00 PM',
        closingTime: '10:00 PM',
        status: 'Closed',
      },
    ]);

    const { result } = renderHook(() => useBars());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getBars).toHaveBeenCalledTimes(1);
    expect(result.current.bars).toEqual([
      expect.objectContaining({ id: '1', __openNow: true }),
      expect.objectContaining({ id: '2', __openNow: false }),
    ]);
  });
});