export const StatsSection = () => {
    return (
        <div className="py-24 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        {value: "$TBD", label: "Total Value Locked"},
                        {value: "TBD", label: "Active Users"},
                        {value: "TBD%", label: "Average APY"},
                    ].map((stat, index) => (
                        <div
                            key={index}
                            className="text-center p-8 rounded-xl border border-secondary/10 backdrop-blur-sm bg-secondary/5 animate-fade-up"
                            style={{animationDelay: `${index * 100}ms`}}
                        >
                            <div
                                className="text-4xl font-bold mb-2 bg-clip-text bg-gradient-to-r from-secondary to-white">
                                {stat.value}
                            </div>
                            <div className="text-accent">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
