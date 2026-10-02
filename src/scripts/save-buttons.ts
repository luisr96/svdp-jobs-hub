import { isSaved, toggleSaved, type SavedJob } from '../lib/saved';

/**
 * Wires every save button under `root`. Each card carries its job snapshot in data-job.
 * `onChange` lets the Saved Jobs page remove a card when it is un-saved.
 */
export function wireSaveButtons(root: ParentNode, onChange?: (card: HTMLElement, saved: boolean) => void) {
  root.querySelectorAll<HTMLButtonElement>('button[data-save]').forEach((btn) => {
    if (btn.dataset.wired) return;
    btn.dataset.wired = 'true';

    const card = btn.closest<HTMLElement>('[data-job]');
    if (!card?.dataset.job) return;
    const job = JSON.parse(card.dataset.job) as Omit<SavedJob, 'savedAt'>;

    btn.setAttribute('aria-pressed', String(isSaved(job.id)));
    btn.addEventListener('click', () => {
      const saved = toggleSaved(job);
      if (saved === null) {
        announce("Sorry, this browser isn't letting us save jobs. Private browsing can cause this.");
        return;
      }
      btn.setAttribute('aria-pressed', String(saved));
      announce(saved ? 'Job saved. Find it under Saved Jobs.' : 'Job removed from Saved Jobs.');
      onChange?.(card, saved);
    });
  });
}

// Visible + screen-reader confirmation. The status region stays in the page at all times
// (only its visibility changes) so screen readers reliably announce updates.
function announce(message: string) {
  const region = document.getElementById('status');
  if (!region) return;
  region.textContent = message;
  region.dataset.show = '';
  clearTimeout(Number(region.dataset.timer));
  region.dataset.timer = String(
    window.setTimeout(() => {
      delete region.dataset.show;
      region.textContent = '';
    }, 4000),
  );
}
