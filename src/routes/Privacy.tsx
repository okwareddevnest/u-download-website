import React from 'react'

export default function Privacy() {
  return (
    <div className="container-app py-12 max-w-4xl">
      <h1 className="mb-8 text-3xl font-bold text-slate-100">Privacy Policy</h1>
      
      <div className="space-y-8 text-slate-300">
        <div>
          <p className="mb-6 text-lg text-slate-200">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          
          <p className="mb-6">
            Your privacy is important to us. This Privacy Policy explains how U-Download handles 
            information when you use our desktop application. We are committed to transparency 
            about our data practices.
          </p>
        </div>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">1. Information We Do NOT Collect</h2>
          <p className="mb-4">U-Download is designed with privacy in mind. We do NOT collect, store, or transmit:</p>
          <ul className="mb-4 pl-6 space-y-2">
            <li>• Personal information (names, email addresses, phone numbers)</li>
            <li>• User accounts or registration data</li>
            <li>• Download history or usage statistics</li>
            <li>• Video URLs or content metadata to external servers</li>
            <li>• Location data or device identifiers</li>
            <li>• Analytics or tracking data</li>
            <li>• Any information to third-party advertising networks</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">2. Local Data Storage</h2>
          <p className="mb-4">U-Download stores certain information locally on your device to function properly:</p>
          <ul className="mb-4 pl-6 space-y-2">
            <li>• <strong>User Preferences:</strong> Your chosen output folder, quality settings, and theme preferences</li>
            <li>• <strong>Application Settings:</strong> Window size, position, and configuration options</li>
            <li>• <strong>Temporary Files:</strong> Cached video metadata for display purposes during downloads</li>
          </ul>
          <p className="mb-4">
            All of this information remains on your local device and is never transmitted to external servers.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">3. How U-Download Works</h2>
          <p className="mb-4">Understanding our process helps explain our privacy approach:</p>
          <ul className="mb-4 pl-6 space-y-2">
            <li>• <strong>Video Information:</strong> When you enter a video URL, U-Download uses yt-dlp to retrieve basic metadata (title, duration, thumbnail) for display</li>
            <li>• <strong>Downloads:</strong> Files are downloaded directly to your chosen folder using aria2c and yt-dlp</li>
            <li>• <strong>Processing:</strong> Video trimming and conversion happen locally using FFmpeg</li>
            <li>• <strong>No Remote Storage:</strong> Everything happens on your device</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">4. Third-Party Tools</h2>
          <p className="mb-4">
            U-Download relies on external tools that you install separately. These tools may have 
            their own privacy implications:
          </p>
          <ul className="mb-4 pl-6 space-y-2">
            <li>• <strong>yt-dlp:</strong> Communicates with video platforms to extract download links</li>
            <li>• <strong>aria2c:</strong> Downloads files from content servers</li>
            <li>• <strong>FFmpeg:</strong> Processes video files locally on your device</li>
          </ul>
          <p className="mb-4">
            We recommend reviewing the privacy policies and documentation of these tools. U-Download 
            itself does not add any additional tracking or data collection beyond what these tools normally do.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">5. Network Communications</h2>
          <p className="mb-4">U-Download's network activity is limited to essential functions:</p>
          <ul className="mb-4 pl-6 space-y-2">
            <li>• <strong>Update Checks:</strong> Periodic checks for new software versions (optional)</li>
            <li>• <strong>Dependency Verification:</strong> Checking if required tools are available on your system</li>
            <li>• <strong>Content Access:</strong> Standard web requests to download videos (handled by yt-dlp/aria2c)</li>
          </ul>
          <p className="mb-4">No personal information is included in these communications.</p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">6. Data Security</h2>
          <p className="mb-4">
            Since U-Download operates locally and doesn't collect personal data, traditional data 
            security concerns are minimal. However, we implement good practices:
          </p>
          <ul className="mb-4 pl-6 space-y-2">
            <li>• Settings are stored securely in your system's standard configuration directories</li>
            <li>• No sensitive information is logged or stored in plain text</li>
            <li>• The application runs with standard user permissions (no elevated access required)</li>
            <li>• Regular security updates are provided through software updates</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">7. Children's Privacy</h2>
          <p className="mb-4">
            U-Download does not collect any personal information from users of any age. The application 
            is designed to be safe for use by individuals of all ages, but we recommend parental 
            supervision to ensure appropriate content is being accessed and downloaded.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">8. Data Deletion</h2>
          <p className="mb-4">You have complete control over your data:</p>
          <ul className="mb-4 pl-6 space-y-2">
            <li>• <strong>Downloaded Files:</strong> Managed entirely by you in your chosen folders</li>
            <li>• <strong>Application Settings:</strong> Can be reset through the application or by uninstalling</li>
            <li>• <strong>Complete Removal:</strong> Uninstalling U-Download removes all associated local data</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">9. International Users</h2>
          <p className="mb-4">
            U-Download is used worldwide and operates the same way regardless of your location. 
            Since we don't collect personal data or maintain servers, international data transfer 
            regulations don't apply to our core functionality.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">10. Open Source Transparency</h2>
          <p className="mb-4">
            U-Download is open source software. This means you can examine our code to verify 
            our privacy claims. The complete source code is available on our official repository, 
            allowing security researchers and users to audit our practices.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">11. Changes to This Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy occasionally to reflect changes in our practices 
            or for legal reasons. Since we don't collect contact information, we'll announce 
            changes through our official channels (GitHub, website). Continued use of U-Download 
            after changes indicates acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-slate-100">12. Contact Us</h2>
          <p className="mb-4">
            If you have questions about this Privacy Policy or our practices, please reach out 
            through our official GitHub repository or website contact methods. We're committed 
            to addressing privacy concerns promptly.
          </p>
        </section>

        <div className="mt-12 p-6 bg-slate-800 rounded-lg border border-slate-700">
          <h3 className="mb-3 text-lg font-semibold text-slate-200">Privacy Summary</h3>
          <p className="text-sm text-slate-400 mb-2">
            <strong className="text-slate-300">What we collect:</strong> Only local settings and preferences stored on your device.
          </p>
          <p className="text-sm text-slate-400 mb-2">
            <strong className="text-slate-300">What we share:</strong> Nothing. We don't have servers or collect data to share.
          </p>
          <p className="text-sm text-slate-400">
            <strong className="text-slate-300">Your control:</strong> Complete. All data stays on your device and can be removed by uninstalling.
          </p>
        </div>
      </div>
    </div>
  )
}