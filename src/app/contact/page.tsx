"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  User,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
  MapPin,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!name.trim()) {
      errs.name = "Name is required.";
    } else if (name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters.";
    } else if (name.trim().length > 100) {
      errs.name = "Name must be under 100 characters.";
    }

    if (!email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (!subject.trim()) {
      errs.subject = "Subject is required.";
    } else if (subject.trim().length < 3) {
      errs.subject = "Subject must be at least 3 characters.";
    } else if (subject.trim().length > 200) {
      errs.subject = "Subject must be under 200 characters.";
    }

    if (!message.trim()) {
      errs.message = "Message is required.";
    } else if (message.trim().length < 10) {
      errs.message = "Message must be at least 10 characters.";
    } else if (message.trim().length > 5000) {
      errs.message = "Message must be under 5000 characters.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (res.ok) {
        setSent(true);
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setErrors({});
      } else {
        const data = await res.json();
        setServerError(data.error || "Failed to send message. Please try again.");
      }
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for reaching out. I&apos;ll get back to you as soon as
            possible.
          </p>
          <Button variant="outline" onClick={() => setSent(false)}>
            Send Another Message
          </Button>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Get in Touch</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Have a question, feedback, or just want to say hello? Fill out the
          form below and I&apos;ll respond as soon as I can.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Contact Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Viraj Nalbalwar</h3>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  CSE Student, COEP Technological University
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  Pune, India
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" />
                  virajnalbalwar@gmail.com
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Response Time</h3>
              <p className="text-sm text-muted-foreground">
                I typically respond within 24–48 hours. For urgent matters,
                please mention it in the subject line.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                      }}
                      placeholder="Your name"
                      maxLength={100}
                      className="mt-1.5"
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive mt-1">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                      }}
                      placeholder="you@example.com"
                      className="mt-1.5"
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">
                    Subject <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      if (errors.subject) setErrors((p) => ({ ...p, subject: undefined }));
                    }}
                    placeholder="What's this about?"
                    maxLength={200}
                    className="mt-1.5"
                  />
                  {errors.subject && (
                    <p className="text-xs text-destructive mt-1">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="message">
                    Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (errors.message) setErrors((p) => ({ ...p, message: undefined }));
                    }}
                    placeholder="Write your message here..."
                    rows={6}
                    maxLength={5000}
                    className="mt-1.5 resize-none"
                  />
                  <div className="flex justify-between mt-1">
                    {errors.message ? (
                      <p className="text-xs text-destructive">{errors.message}</p>
                    ) : (
                      <span />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {message.length}/5000
                    </p>
                  </div>
                </div>

                {serverError && (
                  <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
                    {serverError}
                  </p>
                )}

                <Separator />

                <Button type="submit" disabled={sending} className="w-full gap-2">
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
