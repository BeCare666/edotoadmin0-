// components/notifications/NotificationItem.tsx
export default function NotificationItem({ notif }: any) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition cursor-pointer">

            {/* Icône */}
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="w-5 h-5 text-gray-700"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
            </div>

            {/* Texte */}
            <div className="flex flex-col">
                <p className="font-medium text-gray-900">{notif.title}</p>
                <p className="text-sm text-gray-600">{notif.message}</p>
            </div>

            {/* Badge "nouveau" */}
            {!notif.is_read && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Nouveau
                </span>
            )}
        </div>
    );
}
