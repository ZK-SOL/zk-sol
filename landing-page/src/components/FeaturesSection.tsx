import {Lock, Database, ChartLine} from "lucide-react";

const features = [
    {
        icon: Lock,
        title: "Zero-Knowledge Privacy",
        description: "Complete transaction privacy using cutting-edge ZK-proofs technology",
    },
    {
        icon: Database,
        title: "Liquid Staking",
        description: "Stake your assets while maintaining liquidity for maximum flexibility",
    },
    {
        icon: ChartLine,
        title: "Competitive Yield",
        description: "Earn attractive yields from protocol revenue",
    },
];

export const FeaturesSection = () => {
    return (
        <div className="py-24 px-4 bg-primary/50">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16 animate-fade-up">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Secure, Private, and Profitable
                    </h2>
                    <p className="text-accent max-w-2xl mx-auto">
                        Our platform combines privacy technology with liquid staking to provide you with the best of
                        both worlds
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-xl border border-secondary/10 backdrop-blur-sm bg-secondary/5 transition-all hover:bg-secondary/10 animate-fade-up"
                            style={{animationDelay: `${index * 100}ms`}}
                        >
                            <feature.icon className="w-10 h-10 text-secondary mb-4"/>
                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-accent">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
