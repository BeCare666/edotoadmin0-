// components/icons/BellIcon.tsx
export default function BellIcon({ className = "w-6 h-6" }) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            viewBox="0 0 24 24"
        >
            <path
                d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
