export const BLOCKED_ACCOUNT_MESSAGE =
  'Tài khoản của bạn đã vi phạm nguyên tắc và đã bị đình chỉ. Vui lòng liên hệ bộ phận hỗ trợ.';

export const BLOCKED_ACCOUNT_MESSAGE_PATTERN =
  /đình chỉ|bị khóa|vi phạm nguyên tắc|liên hệ bộ phận hỗ trợ/i;

export const AUTH_BLOCKED_EVENT = 'auth-blocked';

export type AuthBlockedEventDetail = {
  message?: string;
};

export const getErrorMessage = (error: any) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  'Đã xảy ra lỗi. Vui lòng thử lại sau.';

export const isBlockedAccountMessage = (message: string) =>
  BLOCKED_ACCOUNT_MESSAGE_PATTERN.test(message);

export const clearAuthSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth-change'));
};

export const dispatchBlockedAccountEvent = (message = BLOCKED_ACCOUNT_MESSAGE) => {
  window.dispatchEvent(
    new CustomEvent<AuthBlockedEventDetail>(AUTH_BLOCKED_EVENT, {
      detail: { message },
    }),
  );
};
