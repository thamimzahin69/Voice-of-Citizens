import Hero from './Hero';
import Countdown from './Countdown';
import FeatureSummary from './FeatureSummary';
import FAQSnippet from './FAQSnippet';
import AboutSnippet from './AboutSnippet';

export default function Home() {
  return (
    <main>
      <Hero />
      <Countdown />
      <FeatureSummary />
      <FAQSnippet />
      <AboutSnippet />
    </main>
  );
}
