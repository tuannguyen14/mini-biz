export function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Đang tải dữ liệu...
                </h2>

                <p className="text-slate-600 dark:text-slate-400">
                    Vui lòng chờ trong giây lát
                </p>

                <div className="flex justify-center mt-6">
                    <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}