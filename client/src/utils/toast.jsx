import React from 'react';
import { toast } from 'react-toastify';

// Custom toast styles matching the theme
const toastTheme = {
    success: {
        background: '#000000', // Black background
        color: '#10b981', // Green text
        border: '1px solid #10b981', // Green border
    },
    error: {
        background: '#000000', // Black background
        color: '#ef4444', // Red text
        border: '1px solid #ef4444', // Red border
    },
    info: {
        background: '#000000', // Black background
        color: '#60a5fa', // Blue text
        border: '1px solid #60a5fa', // Blue border
    },
    warning: {
        background: '#000000', // Black background
        color: '#f59e0b', // Orange text
        border: '1px solid #f59e0b', // Orange/yellow border
    },
    default: {
        background: '#000000', // Black background
        color: '#9ca3af', // Gray text
        border: '1px solid #9ca3af', // Gray border
    },
};

// Custom toast content component
const ToastContent = ({ message, type = 'default' }) => (
    <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
            {type === 'success' && (
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            )}
            {type === 'error' && (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            )}
            {type === 'info' && (
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )}
            {type === 'warning' && (
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            )}
        </div>
        <div className="flex-1">
            <p className="text-sm font-mono text-gray-200">{message}</p>
        </div>
    </div>
);

// Toast notification functions
export const showToast = {
    success: (message, options = {}) => {
        return toast.success(<ToastContent message={message} type="success" />, {
            position: 'bottom-right',
            autoClose: options.autoClose || 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            className: 'toast-success',
            style: {
                background: toastTheme.success.background,
                color: toastTheme.success.color,
                border: toastTheme.success.border,
            },
            ...options,
        });
    },

    error: (message, options = {}) => {
        return toast.error(<ToastContent message={message} type="error" />, {
            position: 'bottom-right',
            autoClose: options.autoClose || 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            className: 'toast-error',
            style: {
                background: toastTheme.error.background,
                color: toastTheme.error.color,
                border: toastTheme.error.border,
            },
            ...options,
        });
    },

    info: (message, options = {}) => {
        return toast.info(<ToastContent message={message} type="info" />, {
            position: 'bottom-right',
            autoClose: options.autoClose || 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            className: 'toast-info',
            style: {
                background: toastTheme.info.background,
                color: toastTheme.info.color,
                border: toastTheme.info.border,
            },
            ...options,
        });
    },

    warning: (message, options = {}) => {
        return toast.warning(<ToastContent message={message} type="warning" />, {
            position: 'bottom-right',
            autoClose: options.autoClose || 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            className: 'toast-warning',
            style: {
                background: toastTheme.warning.background,
                color: toastTheme.warning.color,
                border: toastTheme.warning.border,
            },
            ...options,
        });
    },

    default: (message, options = {}) => {
        return toast(<ToastContent message={message} type="default" />, {
            position: 'bottom-right',
            autoClose: options.autoClose || 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            className: 'toast-default',
            style: {
                background: toastTheme.default.background,
                color: toastTheme.default.color,
                border: toastTheme.default.border,
            },
            ...options,
        });
    },
};

