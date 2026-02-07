import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Terms of Service | GenTales",
  description: "Terms of Service for GenTales platform.",
};

const LAST_UPDATED = "June 2025";

export default function TermsPage() {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Scale className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <div className="space-y-6">
        <TermsSection title="1. Acceptance of Terms">
          <p>
            By accessing or using GenTales (&quot;the Platform&quot;), you
            agree to be bound by these Terms of Service. If you do not agree
            to these terms, please do not use the Platform.
          </p>
        </TermsSection>

        <TermsSection title="2. Account Registration">
          <ul className="list-disc list-inside space-y-2">
            <li>You must provide accurate and complete registration information.</li>
            <li>You are responsible for maintaining the security of your account.</li>
            <li>You must be at least 13 years of age to create an account.</li>
            <li>One person may not maintain more than one account.</li>
          </ul>
        </TermsSection>

        <TermsSection title="3. User Content">
          <p>
            You retain ownership of stories and content you create on
            GenTales. By publishing content as &quot;public,&quot; you grant
            GenTales a non-exclusive, worldwide, royalty-free license to
            display, distribute, and promote your content on the Platform.
          </p>
          <p>
            You are solely responsible for the content you publish. Content
            must not violate any applicable laws, infringe on intellectual
            property rights, or contain harmful, abusive, or inappropriate
            material.
          </p>
        </TermsSection>

        <TermsSection title="4. AI-Generated Content">
          <p>
            GenTales provides AI-powered story generation features. You
            acknowledge that:
          </p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>AI-generated content may require review and editing before publication.</li>
            <li>You are responsible for any AI-generated content you choose to publish.</li>
            <li>AI outputs may occasionally produce unexpected or inaccurate results.</li>
            <li>GenTales does not guarantee the originality of AI-generated content.</li>
          </ul>
        </TermsSection>

        <TermsSection title="5. Prohibited Conduct">
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-2 mt-2">
            <li>Use the Platform for any illegal or unauthorized purpose</li>
            <li>Post content that is hateful, violent, or sexually explicit</li>
            <li>Harass, abuse, or threaten other users</li>
            <li>Attempt to gain unauthorized access to other accounts or systems</li>
            <li>Use automated scripts or bots to access the Platform</li>
            <li>Interfere with or disrupt the Platform&apos;s infrastructure</li>
          </ul>
        </TermsSection>

        <TermsSection title="6. Intellectual Property">
          <p>
            The GenTales platform, including its design, code, and branding,
            is the intellectual property of its creator. You may not copy,
            modify, or distribute any part of the Platform without prior
            written consent.
          </p>
        </TermsSection>

        <TermsSection title="7. Content Moderation">
          <p>
            GenTales reserves the right to review, remove, or restrict any
            content that violates these Terms or is deemed inappropriate.
            We may suspend or terminate accounts that repeatedly violate
            our guidelines.
          </p>
        </TermsSection>

        <TermsSection title="8. Disclaimer of Warranties">
          <p>
            GenTales is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, either express or
            implied. We do not guarantee uninterrupted or error-free service.
          </p>
        </TermsSection>

        <TermsSection title="9. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, GenTales and its creator
            shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages arising from your use of the
            Platform.
          </p>
        </TermsSection>

        <TermsSection title="10. Termination">
          <p>
            We reserve the right to suspend or terminate your account at any
            time for any reason, including violation of these Terms. You may
            also delete your account at any time. Upon termination, your
            right to use the Platform ceases immediately.
          </p>
        </TermsSection>

        <TermsSection title="11. Changes to Terms">
          <p>
            We may revise these Terms at any time. Continued use of the
            Platform after changes constitutes acceptance of the revised
            Terms. We will notify users of material changes through the
            Platform.
          </p>
        </TermsSection>

        <Separator className="my-8" />

        <TermsSection title="Contact">
          <p>
            For questions regarding these Terms, please contact us at{" "}
            <a
              href="mailto:virajnalbalwar@gmail.com"
              className="text-primary hover:underline"
            >
              virajnalbalwar@gmail.com
            </a>
            .
          </p>
        </TermsSection>
      </div>
    </section>
  );
}

function TermsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
