import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using TradeOps, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily access the materials (information or software) on TradeOps for personal, non-commercial transitory viewing only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Account Security</h2>
              <p>
                Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Trading Rules</h2>
              <p>
                All transactions must be conducted in good faith. Fraudulent activity will result in immediate account termination and may be reported to authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Escrow Services</h2>
              <p>
                Our escrow system is designed to protect both buyers and sellers. Funds are held securely until transaction completion is confirmed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Dispute Resolution</h2>
              <p>
                In case of disputes, our admin team will review all evidence provided by both parties and make a fair determination.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Cryptocurrency Transactions</h2>
              <p>
                By using our Web3 wallet services, you acknowledge that cryptocurrency transactions are irreversible and that you are responsible for ensuring transaction accuracy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Limitations</h2>
              <p>
                TradeOps shall not be held liable for any damages arising from the use or inability to use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Modifications</h2>
              <p>
                We reserve the right to revise these terms at any time. Continued use of the platform constitutes acceptance of any modifications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact</h2>
              <p>
                For questions about these Terms of Service, please contact our support team.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
