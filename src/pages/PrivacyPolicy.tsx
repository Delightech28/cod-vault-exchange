import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, including name, email address, payment information, and gaming account details necessary for facilitating transactions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
              <p>
                Your information is used to facilitate transactions, improve our services, communicate with you, and ensure platform security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Wallet and Blockchain Data</h2>
              <p>
                When using our Web3 wallet features, your blockchain wallet address and transaction history on the Base network are publicly visible on the blockchain. We use Privy for secure wallet management.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Payment Processing</h2>
              <p>
                We use MoonPay for cryptocurrency on/off-ramp services. Your payment information is processed securely through their platform and subject to their privacy policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Information Sharing</h2>
              <p>
                We do not sell your personal information. We may share information with service providers, law enforcement when required, or in business transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. KYC Verification</h2>
              <p>
                For compliance and security purposes, we may require identity verification. This information is stored securely and used only for verification purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your experience, analyze platform usage, and improve our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Your Rights</h2>
              <p>
                You have the right to access, correct, or delete your personal information. You may also object to processing or request data portability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Children's Privacy</h2>
              <p>
                Our services are not intended for users under 18 years of age. We do not knowingly collect information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Updates to Privacy Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any material changes via email or platform notification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact our support team.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
