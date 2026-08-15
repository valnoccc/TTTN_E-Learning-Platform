import { useCallback, useEffect, useState } from 'react';

import axiosClient from '../../../api/axios';
import {
  INSTRUCTOR_ATTENTION_SUMMARY_CHANGED,
} from '../attention-events';

export type InstructorAttentionSummary = {
  unansweredQuestions: number;
  unrespondedReviews: number;
};

const emptySummary: InstructorAttentionSummary = {
  unansweredQuestions: 0,
  unrespondedReviews: 0,
};

export function useInstructorAttentionSummary() {
  const [summary, setSummary] =
    useState<InstructorAttentionSummary>(emptySummary);

  const refresh = useCallback(async () => {
    try {
      const response = await axiosClient.get<InstructorAttentionSummary>(
        '/instructors/me/attention-summary',
      );
      setSummary({
        unansweredQuestions: Number(response.unansweredQuestions) || 0,
        unrespondedReviews: Number(response.unrespondedReviews) || 0,
      });
    } catch {
      setSummary(emptySummary);
    }
  }, []);

  useEffect(() => {
    void refresh();
    window.addEventListener(INSTRUCTOR_ATTENTION_SUMMARY_CHANGED, refresh);

    return () => {
      window.removeEventListener(
        INSTRUCTOR_ATTENTION_SUMMARY_CHANGED,
        refresh,
      );
    };
  }, [refresh]);

  return summary;
}
