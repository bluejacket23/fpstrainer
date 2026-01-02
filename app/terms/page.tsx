"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-neon hover:text-white mb-8 inline-block font-mono text-sm">
          ← Back to Home
        </Link>
        
        <h1 className="text-5xl font-black font-display text-white mb-8 tracking-widest">Terms of Service</h1>
        <div className="text-sm text-gray-400 font-mono mb-8">Last updated: {new Date().toLocaleDateString()}</div>

        <div className="cyber-card p-8 border border-white/10 bg-surface/50 space-y-6 font-mono text-sm leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 mb-4">
              By accessing and using FPS Trainer ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
            <p className="text-gray-300 mb-4">
              Permission is granted to temporarily use the Service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>attempt to decompile or reverse engineer any software contained on the Service;</li>
              <li>remove any copyright or other proprietary notations from the materials.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. User Content</h2>
            <p className="text-gray-300 mb-4">
              You retain all rights to any gameplay videos you upload. By uploading content, you grant us a license to process, analyze, and store your content solely for the purpose of providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Subscription and Payment</h2>
            <p className="text-gray-300 mb-4">
              Subscriptions are billed monthly. You may cancel your subscription at any time. Refunds are not provided for partial billing periods.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Disclaimer</h2>
            <p className="text-gray-300 mb-4">
              The materials on the Service are provided on an 'as is' basis. FPS Trainer makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Limitations</h2>
            <p className="text-gray-300 mb-4">
              In no event shall FPS Trainer or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Contact Information</h2>
            <p className="text-gray-300">
              If you have any questions about these Terms, please contact us through the Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}


