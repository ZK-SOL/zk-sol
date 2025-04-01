import {HeroSection} from "../components/HeroSection";
import {FeaturesSection} from "../components/FeaturesSection";
import {StatsSection} from "../components/StatsSection";

const Home = () => {
    return (
        <>
            <div className="min-h-screen bg-primary text-white">
                <HeroSection/>
                <FeaturesSection/>
                <StatsSection/>
            </div>
        </>
    )
}

export default Home
