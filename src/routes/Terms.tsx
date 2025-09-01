import React from 'react'

export default function Terms() {
  return (
    <div className="container-app py-12 max-w-4xl">
      <h1 className="mb-8 text-3xl font-bold text-slate-100">Terms & Conditions</h1>
      
      <div className="space-y-8 text-slate-300">
        <div>
          <p className="mb-6 text-lg text-slate-200">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <p className="mb-6">
            Welcome to U-Download. By using our application, you agree to these Terms & Conditions. 
            Please read them carefully before using the software.
          </p>
        </div>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By downloading, installing, or using U-Download, you acknowledge that you have read, 
            understood, and agree to be bound by these Terms & Conditions. If you do not agree 
            with these terms, please do not use the application.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">2. What U-Download Does</h2>
          <p className="mb-4">
            U-Download is a desktop application that allows you to download publicly available 
            videos and audio content from YouTube and other supported platforms to your local device. 
            The application provides features including:
          </p>
          <ul className="mb-4 pl-6 space-y-2">
            <li>• Video downloads in various quality formats (MP4)</li>
            <li>• Audio extraction and downloads (MP3)</li>
            <li>• Video trimming and editing capabilities</li>
            <li>• Progress tracking and download management</li>
            <li>• Local file organization and storage</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">3. Permitted Use</h2>
          <p className="mb-4">You may use U-Download for:</p>
          <ul className="mb-4 pl-6 space-y-2">
            <li>• Downloading content you have permission to access</li>
            <li>• Personal, non-commercial use of downloaded content</li>
            <li>• Creating backups of your own uploaded content</li>
            <li>• Educational and research purposes where legally permitted</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">4. Prohibited Use</h2>
          <p className="mb-4">You must NOT use U-Download for:</p>
          <ul className="mb-4 pl-6 space-y-2">
            <li>• Downloading copyrighted content without proper authorization</li>
            <li>• Commercial redistribution of downloaded content</li>
            <li>• Violating any platform's terms of service</li>
            <li>• Bypassing geographic restrictions or access controls</li>
            <li>• Any illegal or unauthorized purposes</li>
            <li>• Bulk downloading that may strain or harm content platforms</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">5. Your Responsibilities</h2>
          <p className="mb-4">As a user of U-Download, you are responsible for:</p>
          <ul className="mb-4 pl-6 space-y-2">
            <li>• Ensuring you have the right to download content</li>
            <li>• Complying with all applicable laws and regulations</li>
            <li>• Respecting intellectual property rights</li>
            <li>• Using the software in a manner that does not harm others</li>
            <li>• Keeping your copy of the software updated and secure</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">6. System Requirements</h2>
          <p className="mb-4">
            U-Download requires additional software components to function properly, including 
            yt-dlp, aria2c, and FFmpeg. You are responsible for installing and maintaining 
            these dependencies on your system. The application will check for these requirements 
            and provide installation guidance.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">7. No Warranty</h2>
          <p className="mb-4">
            U-Download is provided "as is" without warranty of any kind. We do not guarantee 
            that the software will be error-free, continuously available, or suitable for your 
            specific needs. Use the application at your own risk.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">8. Limitation of Liability</h2>
          <p className="mb-4">
            The developers of U-Download shall not be liable for any direct, indirect, incidental, 
            special, or consequential damages resulting from the use or inability to use the software. 
            This includes but is not limited to data loss, system damage, or legal issues arising 
            from improper use.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">9. Third-Party Services</h2>
          <p className="mb-4">
            U-Download integrates with third-party tools and services (yt-dlp, aria2c, FFmpeg, 
            and content platforms). We are not responsible for the availability, functionality, 
            or policies of these external services. Changes to third-party services may affect 
            U-Download's functionality.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">10. Updates and Changes</h2>
          <p className="mb-4">
            We may update U-Download from time to time to improve functionality, fix bugs, 
            or address security issues. We reserve the right to modify these Terms & Conditions 
            with reasonable notice. Continued use of the software after updates constitutes 
            acceptance of any changes.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">11. Open Source</h2>
          <p className="mb-4">
            U-Download is distributed under the MIT License as open source software. You may 
            view, modify, and distribute the source code in accordance with the license terms. 
            The source code is available on our official repository.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">12. Termination</h2>
          <p className="mb-4">
            You may stop using U-Download at any time by uninstalling the software. We reserve 
            the right to discontinue development or support for the application with reasonable notice.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">13. Contact Information</h2>
          <p className="mb-4">
            If you have questions about these Terms & Conditions, please contact us through 
            our official GitHub repository or support channels.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">14. Governing Law</h2>
          <p className="mb-4">
            These Terms & Conditions are governed by applicable international software licensing 
            standards. Any disputes will be resolved in accordance with the laws of your jurisdiction.
          </p>
        </section>

        <div className="mt-12 p-6 bg-slate-800 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400">
            <strong className="text-slate-300">Important:</strong> These terms are designed to 
            protect both users and developers. U-Download is a tool - how you use it is your 
            responsibility. Always respect content creators' rights and follow applicable laws 
            in your region.
          </p>
        </div>
      </div>
    </div>
  )
}