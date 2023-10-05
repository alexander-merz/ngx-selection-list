import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen } from '@testing-library/angular';
import { ListOptionDirective } from '../list-option/list-option.directive';
import { SelectionListDirective } from './selection-list.directive';

describe(SelectionListDirective.name, () => {
  it('should be single selection per default', async () => {
    await render(
      `<div ngxSelectionList>
        <span ngxListOption [value]="1">Option 1</span>
        <span ngxListOption [value]="2">Option 2</span>
        <span ngxListOption [value]="3">Option 3</span>
      </div>`,
      { imports: [ListOptionDirective, SelectionListDirective] },
    );

    const selectionList = screen.getByRole('listbox');

    expect(selectionList).toHaveAttribute('multiple', 'false');
    expect(selectionList).toHaveAttribute('aria-multiselectable', 'false');
    expect(selectionList).not.toHaveAttribute('value');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);

    const [firstOption, _, lastOption] = options;

    expect(firstOption).toHaveAttribute('value', '1');

    fireEvent.click(firstOption);

    expect(selectionList).toHaveAttribute('value', '1');

    fireEvent.click(lastOption);

    expect(selectionList).toHaveAttribute('value', '3');

    fireEvent.click(lastOption);

    expect(selectionList).not.toHaveAttribute('value');
  });

  it('should allow multi selection', async () => {
    await render(
      `<div ngxSelectionList [multiple]="true">
        <span ngxListOption [value]="1">Option 1</span>
        <span ngxListOption [value]="2">Option 2</span>
        <span ngxListOption [value]="3">Option 3</span>
      </div>`,
      { imports: [ListOptionDirective, SelectionListDirective] },
    );

    const selectionList = screen.getByRole('listbox');

    expect(selectionList).toHaveAttribute('multiple', 'true');
    expect(selectionList).toHaveAttribute('aria-multiselectable', 'true');
    expect(selectionList).not.toHaveAttribute('value');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);

    const [firstOption, _, lastOption] = options;

    expect(firstOption).toHaveAttribute('value', '1');

    fireEvent.click(firstOption);

    expect(selectionList).toHaveAttribute('value', '1');

    fireEvent.click(lastOption);

    expect(selectionList).toHaveAttribute('value', '1,3');
  });

  it('should have an initial and empty value of null for single selection', async () => {
    @Component({
      standalone: true,
      imports: [ListOptionDirective, SelectionListDirective],
      template: `
        <div ngxSelectionList>
          <span ngxListOption [value]="1">Option 1</span>
        </div>
      `,
    })
    class TestComponent {
      @ViewChild(SelectionListDirective) readonly selectionList!: SelectionListDirective;
      @ViewChildren(ListOptionDirective) readonly listOptions!: QueryList<ListOptionDirective>;
    }

    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.selectionList.value).toBeNull();

    component.listOptions.first.select();

    expect(component.selectionList.value).toBe(1);

    component.listOptions.first.deselect();

    expect(component.selectionList.value).toBeNull();
  });

  it('should have an initial and empty value of null for multi selection', async () => {
    @Component({
      standalone: true,
      imports: [ListOptionDirective, SelectionListDirective],
      template: `
        <div ngxSelectionList [multiple]="true">
          <span ngxListOption [value]="1">Option 1</span>
          <span ngxListOption [value]="2">Option 2</span>
          <span ngxListOption [value]="3">Option 3</span>
        </div>
      `,
    })
    class TestComponent {
      @ViewChild(SelectionListDirective) readonly selectionList!: SelectionListDirective;
      @ViewChildren(ListOptionDirective) readonly listOptions!: QueryList<ListOptionDirective>;
    }

    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    const fixture = TestBed.createComponent(TestComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.selectionList.value).toBeNull();

    component.listOptions.first.select();
    component.listOptions.last.select();

    expect(component.selectionList.value).toStrictEqual([1, 3]);

    component.listOptions.first.deselect();
    component.listOptions.last.deselect();

    expect(component.selectionList.value).toBeNull();
  });
});
