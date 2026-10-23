/** Keep modal behavior separate from slide navigation and presentation state. */
export function setupSourceDialog(
  reader: HTMLElement,
  sourceDialog: HTMLDialogElement,
  currentPage: () => number,
  onActivity: () => void,
) {
  const sourceButton = reader.querySelector<HTMLButtonElement>('#source-button')!;
  const sourceBody = sourceDialog.querySelector<HTMLElement>('.source-dialog-body')!;
  const sourceClose = sourceDialog.querySelector<HTMLButtonElement>('#source-dialog-close')!;
  const sourcePanels = new Map([...sourceDialog.querySelectorAll<HTMLElement>('[data-source-page]')]
    .map(panel => [Number(panel.dataset.sourcePage), panel]));
  let activePanel: HTMLElement | undefined;

  sourceButton.addEventListener('click', () => {
    const panel = sourcePanels.get(currentPage());
    if (!panel) return;
    if (activePanel && activePanel !== panel) activePanel.hidden = true;
    panel.hidden = false;
    activePanel = panel;
    if (!sourceDialog.open) sourceDialog.showModal();
    sourceBody.scrollTo({ top: 0, behavior: 'instant' });
    onActivity();
  });
  sourceClose.addEventListener('click', () => sourceDialog.close());
  sourceDialog.addEventListener('cancel', event => {
    event.preventDefault();
    sourceDialog.close();
  });
  sourceDialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...sourceDialog.querySelectorAll<HTMLElement>('button, a[href]')].filter(element => element.getClientRects().length > 0);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  sourceDialog.addEventListener('click', event => {
    if (event.target !== sourceDialog) return;
    const bounds = sourceDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) sourceDialog.close();
  });
  sourceDialog.addEventListener('close', () => {
    sourceButton.focus({ preventScroll: true });
    onActivity();
  });
}
