export const INSTRUCTOR_ATTENTION_SUMMARY_CHANGED =
  'instructor-attention-summary-changed';

export function notifyInstructorAttentionSummaryChanged() {
  window.dispatchEvent(new Event(INSTRUCTOR_ATTENTION_SUMMARY_CHANGED));
}
