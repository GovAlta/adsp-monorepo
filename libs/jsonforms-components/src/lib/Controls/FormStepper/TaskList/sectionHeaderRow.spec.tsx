import { SectionHeaderRow } from './sectionHeaderRow';
import { render, screen } from '@testing-library/react';

describe('Can render section header row', () => {
  it('can render sectionHeader Row', () => {
    render(<SectionHeaderRow title={'mock-title'} index={1} />);
    expect(screen.queryByText('1. mock-title')).toBeTruthy();
  });
});
