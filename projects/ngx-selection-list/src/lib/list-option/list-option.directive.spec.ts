import { fireEvent, render, screen } from '@testing-library/angular';

import { ListOptionDirective } from "./list-option.directive";

describe(ListOptionDirective.name, () => {
  it('should toggle selected state upon click', async () => {
    await render('<span ngxListOption [value]="1">Option 1</span>', {
      imports: [ListOptionDirective],
    });

    const option = screen.getByRole('option');

    expect(option).toHaveAccessibleName('Option 1');
    expect(option).toHaveAttribute('value', '1');
    expect(option).not.toHaveAttribute('selected');
    expect(option).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(option);

    expect(option).toHaveAttribute('selected', 'selected');
    expect(option).toHaveAttribute('aria-selected', 'true');
  });
});