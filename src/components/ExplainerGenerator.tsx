
import React, { useState } from 'react';
import { ArrowLeft, Link, Type, Download, Share, Sparkles } from 'lucide-react';

interface ExplainerData {
  headline: string;
  tldr: string;
  whyItMatters: string;
  quote: string;
  imageUrl: string;
}

interface ExplainerGeneratorProps {
  onBack: () => void;
}

const ExplainerGenerator = ({ onBack }: ExplainerGeneratorProps) => {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState('');
  const [explainer, setExplainer] = useState<ExplainerData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cardsCreated, setCardsCreated] = useState(0);

  const generateExplainer = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation with placeholder data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockExplainer: ExplainerData = {
      headline: input.startsWith('http') ? 'AI Revolution in Healthcare' : input,
      tldr: 'AI is transforming how doctors diagnose diseases, making healthcare faster and more accurate than ever before.',
      whyItMatters: 'This breakthrough could save millions of lives by catching diseases early and reducing medical errors by up to 40%.',
      quote: '"AI can now detect cancer in medical scans 20% more accurately than human doctors" - Stanford Medical Study',
      imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=600&fit=crop'
    };
    
    setExplainer(mockExplainer);
    setIsGenerating(false);
    setStep(3);
  };

  const handlePublish = () => {
    setCardsCreated(prev => prev + 1);
    // Reset for next creation
    setStep(1);
    setInput('');
    setExplainer(null);
    onBack();
  };

  const renderStep1 = () => (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-white/60 hover:text-white mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-white">Create Explainer</h1>
      </div>

      <div className="mb-8">
        <p className="text-white/60 mb-6">
          Enter a headline or paste an article URL
        </p>
        
        <div className="space-y-4">
          <div className="relative">
            <Type className="absolute left-3 top-3 w-5 h-5 text-white/40" />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your headline or topic..."
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-blue-400 focus:outline-none resize-none"
              rows={3}
            />
          </div>
          
          <div className="text-center text-white/40">or</div>
          
          <div className="relative">
            <Link className="absolute left-3 top-3 w-5 h-5 text-white/40" />
            <input
              type="url"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste article URL..."
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-12 pr-4 py-3 text-white placeholder-white/40 focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-white/60 mb-2">
          <span>Free cards remaining</span>
          <span>{5 - cardsCreated}/5</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className="bg-blue-400 h-2 rounded-full transition-all"
            style={{ width: `${((5 - cardsCreated) / 5) * 100}%` }}
          />
        </div>
      </div>

      <button
        onClick={generateExplainer}
        disabled={!input.trim() || cardsCreated >= 5}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/40 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Generate Explainer
      </button>

      {cardsCreated >= 5 && (
        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-amber-400 text-sm text-center">
            Free limit reached! Upgrade to Pro for unlimited explainers.
          </p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="p-6 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-white text-lg mb-2">Generating your explainer...</p>
        <p className="text-white/60 text-sm">This may take a few seconds</p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button onClick={() => setStep(1)} className="text-white/60 hover:text-white mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold text-white">Edit Explainer</h1>
      </div>

      {explainer && (
        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Headline</label>
            <input
              value={explainer.headline}
              onChange={(e) => setExplainer({...explainer, headline: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">TL;DR</label>
            <textarea
              value={explainer.tldr}
              onChange={(e) => setExplainer({...explainer, tldr: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none resize-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Why This Matters</label>
            <textarea
              value={explainer.whyItMatters}
              onChange={(e) => setExplainer({...explainer, whyItMatters: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Quote/Stat (Optional)</label>
            <input
              value={explainer.quote}
              onChange={(e) => setExplainer({...explainer, quote: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">Image URL</label>
            <input
              value={explainer.imageUrl}
              onChange={(e) => setExplainer({...explainer, imageUrl: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={handlePublish}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Publish to Feed
        </button>
        
        <button className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
          <Download className="w-5 h-5" />
        </button>
        
        <button className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
          <Share className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  if (isGenerating) return renderStep2();
  if (step === 3) return renderStep3();
  return renderStep1();
};

export default ExplainerGenerator;
