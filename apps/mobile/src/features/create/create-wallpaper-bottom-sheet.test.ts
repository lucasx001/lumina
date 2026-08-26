import { fixedCreateSheetBehavior } from './create-wallpaper-bottom-sheet';

describe('fixedCreateSheetBehavior', () => {
  it('allows pan-down dismissal while keeping the sheet at one fixed height', () => {
    expect(fixedCreateSheetBehavior).toEqual({
      enableContentPanningGesture: true,
      enableDynamicSizing: false,
      enableHandlePanningGesture: false,
      enableOverDrag: false,
      enablePanDownToClose: true,
      handleComponent: null,
    });
  });
});
