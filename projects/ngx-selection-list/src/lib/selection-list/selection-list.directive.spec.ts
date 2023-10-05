import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { fireEvent, render, screen } from '@testing-library/angular';
import { ListOptionDirective } from '../list-option/list-option.directive';
import { SelectionListDirective } from './selection-list.directive';

describe(SelectionListDirective.name, () => {
  describe('Selection mode', () => {
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
  });

  describe('Value behavior', () => {
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
      class SingleSelectTestComponent {
        @ViewChild(SelectionListDirective) readonly selectionList!: SelectionListDirective;
        @ViewChildren(ListOptionDirective) readonly listOptions!: QueryList<ListOptionDirective>;
      }

      await TestBed.configureTestingModule({ imports: [SingleSelectTestComponent] }).compileComponents();

      const fixture = TestBed.createComponent(SingleSelectTestComponent);
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
      class MultiSelectTestComponent {
        @ViewChild(SelectionListDirective) readonly selectionList!: SelectionListDirective;
        @ViewChildren(ListOptionDirective) readonly listOptions!: QueryList<ListOptionDirective>;
      }

      await TestBed.configureTestingModule({ imports: [MultiSelectTestComponent] }).compileComponents();

      const fixture = TestBed.createComponent(MultiSelectTestComponent);
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

  describe('Compatibility', () => {
    describe('with reactive forms', () => {
      @Component({
        standalone: true,
        imports: [ListOptionDirective, SelectionListDirective, ReactiveFormsModule],
        template: `
          <div ngxSelectionList [multiple]="true" [formControl]="formControl">
            <span ngxListOption [value]="1">Option 1</span>
            <span ngxListOption [value]="2">Option 2</span>
            <span ngxListOption [value]="3">Option 3</span>
          </div>
        `,
      })
      class ReactiveFormTestComponent {
        @ViewChild(SelectionListDirective) readonly selectionList!: SelectionListDirective;
        @ViewChildren(ListOptionDirective) readonly listOptions!: QueryList<ListOptionDirective>;
        readonly formControl = new FormControl();
      }

      it('should not include null as actual value when form control with no initial value is applied', async () => {
        await TestBed.configureTestingModule({ imports: [ReactiveFormTestComponent] }).compileComponents();

        const fixture = TestBed.createComponent(ReactiveFormTestComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();

        expect(component.selectionList.value).not.toStrictEqual([null]);
        expect(component.selectionList.value).toBeNull();
      });
    });
  });
});
