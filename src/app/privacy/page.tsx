import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Privacy Policy | GenTales",
  description: "Privacy Policy for GenTales — how we handle your data.",
};

const LAST_UPDATED = "June 2025";

export default function PrivacyPage() {
  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED}
        </p>
      </div>

      <div className="space-y-6">
        <PolicySection title="1. Information We Collect">
          <p>
            When you create an account on GenTales, we collect the information
            you provide through our authentication provider (Clerk), including
            your name, email address, and profile picture. We also collect
            usage data such as stories you read, like, or bookmark.
          </p>
        </PolicySection>

        <PolicySection title="2. How We Use Your Information">
          <ul className="list-disc list-inside space-y-2">
            <li>To provide and maintain the GenTales platform</li>
            <li>To personalize your feed and recommendations</li>
            <li>To enable social features (following, likes, bookmarks)</li>
            <li>To track anonymous view counts and engagement metrics</li>
            <li>To communicate with you about your account or service updates</li>
          </ul>
        </PolicySection>

        <PolicySection title="3. AI &amp; Story Generation">
          <p>
            GenTales uses locally-hosted AI models via Ollama for story
            generation. Your prompts and generated content are processed on
            our server infrastructure and are <strong>not</strong> sent to
            third-party AI providers. Generated stories are stored in our
            database and associated with your account.
          </p>
        </PolicySection>

        <PolicySection title="4. Data Storage &amp; Security">
          <p>
            Your data is stored in MongoDB databases with standard security
            measures. Authentication is handled by Clerk, a trusted
            third-party authentication provider. We implement reasonable
            technical and organizational measures to protect your personal
            information against unauthorized access, alteration, or
            destruction.
          </p>
        </PolicySection>

        <PolicySection title="5. Cookies &amp; Tracking">
          <p>
            We use essential cookies required for authentication and session
            management. We collect anonymous view data using IP-based hashing
            (your actual IP address is never stored). We do not use
            third-party advertising trackers.
          </p>
        </PolicySection>

        <PolicySection title="6. Data Sharing">
          <p>
            We do not sell, trade, or rent your personal information to third
            parties. We may share anonymized, aggregated data for analytics
            purposes. Your public stories and profile information are visible
            to other users as part of the platform&apos;s social features.
          </p>
        </PolicySection>

        <PolicySection title="7. Your Rights">
          <ul className="list-disc list-inside space-y-2">
            <li>Access and download your personal data</li>
            <li>Update or correct your profile information</li>
            <li>Delete your account and associated data</li>
            <li>Control the visibility of your stories (public/private)</li>
          </ul>
        </PolicySection>

        <PolicySection title="8. Children&apos;s Privacy">
          <p>
            GenTales is not intended for children under the age of 13. We do
            not knowingly collect personal information from children under 13.
          </p>
        </PolicySection>

        <PolicySection title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will
            notify users of any material changes by posting the new policy on
            this page with an updated revision date.
          </p>
        </PolicySection>

        <Separator className="my-8" />

        <PolicySection title="Contact">
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at{" "}
            <a
              href="mailto:virajnalbalwar@gmail.com"
              className="text-primary hover:underline"
            >
              virajnalbalwar@gmail.com
            </a>
            .
          </p>
        </PolicySection>
      </div>
    </section>
  );
}

function PolicySection({
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
