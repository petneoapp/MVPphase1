"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Heart, ShieldCheck, Stethoscope, Star, CheckCircle2, ChevronRight, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/common/ui/Button";
import { Card, CardContent } from "@/components/common/ui/Card";
import { Badge } from "@/components/common/ui/Badge";
import { Input } from "@/components/common/ui/Input";
import { Skeleton } from "@/components/common/ui/Skeleton";
import { Modal } from "@/components/common/ui/Modal";
import { api } from "@/utils/api";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6, ease: "easeOut" as const }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
};

export default function StorefrontHome() {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [homeSections, setHomeSections] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [homeData, campaignData] = await Promise.all([
          api.get("/homeContent").catch(() => []),
          api.get("/campaigns").catch(() => [])
        ]);
        setHomeSections(Array.isArray(homeData) ? homeData : []);
        setCampaigns(Array.isArray(campaignData) ? campaignData : []);
      } catch (err) {
        console.error("Failed to fetch home content", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, []);

  const renderCampaigns = () => {
    if (!campaigns || campaigns.length === 0) return null;
    return (
      <div className="w-full bg-[var(--color-primary-600)] text-white relative z-50">
        {campaigns.map((camp: any) => (
          <div key={camp.id} className="py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            {camp.title}: {camp.description}
            {camp.target_url && (
              <a href={camp.target_url} className="underline ml-2 text-yellow-100 hover:text-white transition-colors">
                {camp.cta || "Learn More"}
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderHero = (section: any) => (
    <section key={section.id} className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden bg-gradient-to-br from-[var(--color-surface)] via-white to-[var(--color-primary-50)]">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[var(--color-primary-100)] rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[var(--color-success-100)] rounded-full blur-[100px] opacity-40"></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-2xl">
            <motion.div variants={staggerItem} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-[var(--color-border)] text-sm font-medium text-slate-700 mb-8 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-[var(--color-primary-600)]" />
              Trusted by pet parents everywhere
            </motion.div>
            <motion.h1 variants={staggerItem} className="text-5xl md:text-6xl lg:text-7xl font-bold text-[var(--color-foreground)] leading-[1.1] tracking-tight mb-6">
              {section.title || "Intelligent care for your best friend."}
            </motion.h1>
            <motion.p variants={staggerItem} className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl font-medium">
              {section.description || "Book verified veterinarians and discover curated wellness products."}
            </motion.p>
            <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="h-14 px-8" rightIcon={<ArrowRight className="w-5 h-5" />}>Explore Wellness</Button>
              <Button size="lg" variant="outline" className="h-14 px-8 bg-white/50 backdrop-blur-sm" onClick={() => setIsAiModalOpen(true)}>Ask AI Assistant</Button>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }} className="relative hidden lg:block">
            <div className="aspect-[4/3] rounded-[2rem] overflow-hidden shadow-[var(--shadow-premium-lg)] relative bg-slate-100 border border-white/40">
              {section.image_url ? (
                <Image src={section.image_url} alt="Hero" fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary-50)] to-white flex flex-col items-center justify-center p-12 text-center">
                  <Heart className="w-10 h-10 text-[var(--color-primary-400)] mb-6" />
                  <h3 className="text-2xl font-bold text-[var(--color-foreground)]">Holistic Wellness</h3>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );

  const renderTestimonials = (section: any) => {
    const items = section.content_data?.items || [];
    if (!items.length) return null;
    return (
      <section key={section.id} className="py-24 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-10 text-slate-800">{section.title || "Happy Customers"}</h2>
          <div className="flex flex-wrap justify-center gap-10">
            {items.map((item: any, i: number) => (
              <motion.div key={i} {...fadeIn} className="w-[300px] bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden text-left">
                {item.img && (
                  <div className="w-full h-[250px] relative">
                    <Image src={item.img} alt={item.name} fill className="object-cover" />
                  </div>
                )}
                <div className="px-6 py-5">
                  <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">"{item.feedback}"</p>
                  <div className="flex items-center gap-1 mt-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < (item.rating || 5) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderFeaturedVets = (section: any) => {
    const vets = section.content_data?.items || [];
    return (
      <section key={section.id} className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="flex flex-col md:flex-row justify-between gap-6 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-foreground)] tracking-tight mb-4">
                {section.title || "Verified professionals"}
              </h2>
              <p className="text-lg text-slate-600 font-medium">
                {section.description || "Book appointments with top-rated, fully credentialed veterinarians."}
              </p>
            </div>
            <Link href="/vets">
              <Button variant="ghost" rightIcon={<ArrowRight className="w-4 h-4" />}>View All Vets</Button>
            </Link>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vets.length === 0 ? (
              <p className="text-slate-500 italic">No featured vets at this time.</p>
            ) : vets.map((vet: any, i: number) => (
              <motion.div key={i} variants={staggerItem} initial="hidden" whileInView="show" viewport={{ once: true }}>
                <Card variant="interactive" className="group h-full bg-white flex flex-col justify-between">
                  <div>
                    <div className="h-32 bg-[var(--color-primary-50)] relative overflow-hidden flex items-end p-4">
                      <Badge variant="success" className="mb-2 bg-white text-[var(--color-success-700)] border-none shadow-sm font-semibold">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    </div>
                    <CardContent className="p-6 relative pt-10">
                      <div className="absolute -top-10 left-6 w-20 h-20 rounded-full border-4 border-white bg-slate-100 z-20 flex items-center justify-center overflow-hidden shadow-sm">
                         {vet.profile_picture_url ? <Image src={vet.profile_picture_url} alt={vet.name} fill className="object-cover" /> : <Stethoscope className="w-8 h-8 text-slate-400" />}
                      </div>
                      <h3 className="text-xl font-bold text-[var(--color-foreground)] mb-1">{vet.name}</h3>
                      <p className="text-sm text-slate-500 font-medium mb-6">{vet.clinic_name || "PetNeo Certified Vet"}</p>
                    </CardContent>
                  </div>
                  <div className="p-6 pt-0 mt-auto">
                    <Button variant="secondary" className="w-full justify-center group-hover:bg-[var(--color-primary-600)] transition-colors">Book Appointment</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderProducts = (section: any) => {
    const products = section.content_data?.items || [];
    return (
      <section key={section.id} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 {...fadeIn} className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] mb-10">
            {section.title || "Curated Wellness & Care"}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((prod: any, i: number) => (
              <motion.div key={i} {...fadeIn} className="h-full">
                <Link href="/shop" className="block h-full">
                  <Card className="h-full bg-slate-50 p-6 flex flex-col justify-end min-h-[220px] group border border-transparent hover:border-slate-200">
                    <div className="relative z-10 mt-auto">
                      <h3 className="text-xl font-bold text-[var(--color-foreground)] mb-2">{prod.title}</h3>
                      <p className="text-sm text-slate-600">{prod.desc}</p>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderAiAssistant = () => (
    <section key="ai-assistant" className="py-24 relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeIn} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] p-8 md:p-16 overflow-hidden relative shadow-[var(--shadow-premium-sm)]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-primary-50)] rounded-full blur-[100px] opacity-50 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary-50)] text-sm font-medium text-[var(--color-primary-700)] mb-8">
                <Sparkles className="w-4 h-4" /> Intelligent Triage
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] leading-[1.1] mb-6">Peace of mind, <br/>available 24/7.</h2>
              <p className="text-slate-600 text-lg mb-10 leading-relaxed max-w-md">
                Describe what you're noticing. Our AI triage system instantly analyzes symptoms.
              </p>
              <div className="bg-white border rounded-[var(--radius-button)] p-2 flex items-center shadow-sm max-w-md focus-within:ring-2 focus-within:ring-[var(--color-primary-500)]">
                <Input type="text" placeholder="E.g., My dog is lethargic..." className="border-none shadow-none focus-visible:ring-0 px-4 py-3 bg-transparent" />
                <Button variant="primary" onClick={() => setIsAiModalOpen(true)}>Analyze</Button>
              </div>
            </div>
            <div className="hidden lg:flex flex-col gap-6">
              <div className="bg-white border p-5 rounded-3xl rounded-tr-sm self-end max-w-[85%] shadow-sm">
                <p className="text-slate-700 font-medium">Bella has been scratching her ears a lot since yesterday.</p>
              </div>
              <div className="bg-[var(--color-primary-50)] p-6 rounded-3xl rounded-tl-sm self-start max-w-[90%] shadow-sm border border-white">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-4 h-4 text-[var(--color-primary-600)]" />
                  <span className="text-xs font-bold text-[var(--color-primary-700)] uppercase">PetNeo AI</span>
                </div>
                <p className="text-slate-800 text-base font-medium mb-5">Sounds like an ear infection or allergy. It's not an emergency, but you should have a vet look at it soon.</p>
                <Button variant="outline" className="w-full justify-center bg-white" rightIcon={<ChevronRight className="w-4 h-4" />}>Find vets near you</Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-surface)]">
      {renderCampaigns()}
      
      {isLoading ? (
        <div className="w-full flex items-center justify-center p-32">
          <Skeleton className="w-full max-w-4xl h-96 rounded-2xl" />
        </div>
      ) : homeSections.length > 0 ? (
        homeSections.map((section: any) => {
          if (section.section_type === "HERO") return renderHero(section);
          if (section.section_type === "TESTIMONIALS") return renderTestimonials(section);
          if (section.section_type === "FEATURED_VETS") return renderFeaturedVets(section);
          if (section.section_type === "FEATURED_PRODUCTS") return renderProducts(section);
          return null;
        })
      ) : (
        // Fallback gracefully if no DB content is found
        <>
          {renderHero({ title: "Welcome to PetNeo", description: "Your complete pet care companion." })}
          {renderAiAssistant()}
        </>
      )}

      {/* AI Assistant is always available */}
      {homeSections.length > 0 && renderAiAssistant()}

      {/* AI Assistant Modal */}
      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="PetNeo AI Assistant" description="Describe your pet's symptoms for immediate guidance.">
        <div className="space-y-6 pt-2">
          <div className="bg-[var(--color-surface-muted)] p-4 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-[var(--color-primary-700)] mt-1 flex-shrink-0" />
            <p className="text-sm font-medium">Hello! Describe what's going on with your pet in detail.</p>
          </div>
          <div className="space-y-3">
            <Input placeholder="e.g. My dog is vomiting..." className="py-3" />
            <Button variant="primary" className="w-full justify-center">Analyze Symptoms</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
