import { fireEvent, render, screen } from '@testing-library/react-native';

import { DealEventModal, DealEventPill } from '../deal-event-modal';

jest.mock('@/utils/locationLogos', () => ({
  getLogoAssetForLocationName: jest.fn(() => ({ uri: 'logo.png' })),
}));

describe('DealEventModal and DealEventPill', () => {
  it('shows the correct label for event and deal pills', () => {
    render(<DealEventPill kind="event" />);
    expect(screen.getByText('Event')).toBeTruthy();

    render(<DealEventPill kind="deal" />);
    expect(screen.getByText('Deal')).toBeTruthy();
  });

  it('renders event details and invokes callbacks when opening the bar details', () => {
    const onClose = jest.fn();
    const onBarPress = jest.fn();

    render(
      <DealEventModal
        item={{
          id: 'e-1',
          kind: 'event',
          title: 'DJ Night',
          subtitle: 'Starts at 9',
          startTime: '9:00 PM',
        }}
        barName="Cy's Roost"
        barId="42"
        onClose={onClose}
        onBarPress={onBarPress}
      />
    );

    expect(screen.getByText('DJ Night')).toBeTruthy();
    expect(screen.getByText('Starts at 9')).toBeTruthy();

    fireEvent.press(screen.getByText("View Cy's Roost Details"));

    expect(onClose).toHaveBeenCalled();
    expect(onBarPress).toHaveBeenCalledWith('42');
  });
});