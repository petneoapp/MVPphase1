"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Heart, ShieldCheck, Stethoscope, Star, CheckCircle2, ChevronRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/common/ui/Button";
import { Card, CardContent } from "@/components/common/ui/Card";
import { Badge } from "@/components/common/ui/Badge";
import { Input } from "@/components/common/ui/Input";
import { Skeleton } from "@/components/common/ui/Skeleton";
import { Modal } from "@/components/common/ui/Modal";

export default function StorefrontHome() {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isLoadingVets, setIsLoadingVets] = useState(true);

  // Simulate network loading for vets to showcase the new Skeleton system
  useEffect(() => {
    const timer = setTimeout(() => setIsLoadingVets(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] } }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-surface)]">
      
      {/* 1. Cinematic Hero Section - Headspace/Calm Vibe */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-gradient-to-br from-[var(--color-surface)] via-white to-[var(--color-primary-50)]">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Subtle breathable ambient gradients */}
          <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[var(--color-primary-100)] rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[var(--color-success-100)] rounded-full blur-[100px] opacity-40"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="max-w-2xl"
            >
              <motion.div variants={staggerItem} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-[var(--color-border)] text-sm font-medium text-slate-700 mb-8 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[var(--color-primary-600)]" />
                Trusted by 45,000+ pet parents
              </motion.div>
              
              <motion.h1 variants={staggerItem} className="text-5xl md:text-6xl lg:text-7xl font-bold text-[var(--color-foreground)] leading-[1.1] tracking-tight mb-6">
                Intelligent care <br/>
                <span className="text-slate-400 font-medium">for your best friend.</span>
              </motion.h1>
              
              <motion.p variants={staggerItem} className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl font-medium">
                Book verified veterinarians, discover curated wellness products, and get immediate peace of mind with our AI symptom checker.
              </motion.p>
              
              <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="h-14 px-8 text-base shadow-[var(--shadow-premium-md)] hover:shadow-[var(--shadow-premium-lg)] transition-premium" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Explore Wellness
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-base bg-white/50 backdrop-blur-sm" leftIcon={<Sparkles className="w-5 h-5 text-[var(--color-primary-600)]" />} onClick={() => setIsAiModalOpen(true)}>
                  Ask AI Assistant
                </Button>
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.1, 0.25, 1.0] }}
              className="relative hidden lg:block"
            >
              <div className="aspect-[4/3] rounded-[2rem] overflow-hidden shadow-[var(--shadow-premium-lg)] relative bg-slate-100 border border-white/40">
                {/* Abstract Premium Placeholder instead of generic image */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary-50)] to-white flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                    <Heart className="w-10 h-10 text-[var(--color-primary-400)]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">Holistic Wellness Ecosystem</h3>
                  <p className="text-slate-500">Connecting you to premium veterinary care.</p>
                </div>
                
                {/* Floating Trust UI Element */}
                <div className="absolute bottom-8 left-8 right-8 p-5 bg-white/95 backdrop-blur-md rounded-2xl shadow-[var(--shadow-premium-md)] border border-white flex items-center gap-4 animate-in slide-in-from-bottom-8 duration-1000 delay-500 fade-in fill-mode-both">
                  <div className="w-14 h-14 bg-[var(--color-success-50)] rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-7 h-7 text-[var(--color-success-600)]" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[var(--color-foreground)]">Dr. Sarah Jenkins Approved</p>
                    <p className="text-sm text-slate-500 font-medium">Appointment confirmed for tomorrow at 10:00 AM</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Interactive AI Assistant Section - Glassmorphic */}
      <section className="py-24 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] p-8 md:p-16 overflow-hidden relative shadow-[var(--shadow-premium-sm)]">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-primary-50)] rounded-full blur-[100px] opacity-50 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary-50)] text-sm font-medium text-[var(--color-primary-700)] mb-8">
                  <Sparkles className="w-4 h-4" />
                  Intelligent Triage
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-foreground)] leading-[1.1] mb-6 tracking-tight">
                  Peace of mind, <br/>available 24/7.
                </h2>
                <p className="text-slate-600 text-lg mb-10 leading-relaxed max-w-md">
                  Describe what you're noticing. Our AI triage system instantly analyzes the symptoms and advises whether you need emergency care, a scheduled vet visit, or simple home observation.
                </p>
                <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-button)] p-2 flex items-center shadow-sm max-w-md transition-premium focus-within:ring-4 focus-within:ring-[var(--color-primary-500)]/20 focus-within:border-[var(--color-primary-500)]">
                  <Input 
                    type="text" 
                    placeholder="E.g., My dog is lethargic..." 
                    className="border-none shadow-none focus-visible:ring-0 px-4 py-3 bg-transparent"
                  />
                  <Button variant="primary" className="flex-shrink-0" onClick={() => setIsAiModalOpen(true)}>
                    Analyze
                  </Button>
                </div>
              </div>
              
              {/* Refined Mock Chat Interface */}
              <div className="hidden lg:flex flex-col gap-6">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="bg-white border border-[var(--color-border)] shadow-sm p-5 rounded-3xl rounded-tr-sm self-end max-w-[85%]"
                >
                  <p className="text-slate-700 font-medium">Bella has been scratching her ears a lot since yesterday and they look a bit red.</p>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="bg-[var(--color-primary-50)] p-6 rounded-3xl rounded-tl-sm self-start max-w-[90%] shadow-[var(--shadow-premium-md)] border border-white"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Sparkles className="w-4 h-4 text-[var(--color-primary-600)]" />
                    </div>
                    <span className="text-xs font-bold text-[var(--color-primary-700)] uppercase tracking-widest">PetNeo AI</span>
                  </div>
                  <p className="text-slate-800 text-base leading-relaxed font-medium mb-5">
                    Based on your description, this sounds like a potential ear infection or allergy, which is common. It's not an emergency, but you should have a vet look at it soon.
                  </p>
                  <Button variant="outline" className="w-full justify-center bg-white" rightIcon={<ChevronRight className="w-4 h-4" />}>
                    Find available vets near you
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Verified Care (Nearby Vets) - Skeleton Integration */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-foreground)] tracking-tight mb-4 leading-tight">
                Verified professionals, <br/>just around the corner.
              </h2>
              <p className="text-lg text-slate-600 font-medium">
                Book appointments with top-rated, fully credentialed veterinarians in your neighborhood.
              </p>
            </div>
            <Button variant="ghost" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All Vets
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoadingVets ? (
              // Skeleton Loading State
              Array(3).fill(0).map((_, i) => (
                <Card key={`skeleton-${i}`} variant="default" className="border-transparent bg-white shadow-sm overflow-hidden p-0">
                  <Skeleton variant="rectangular" className="h-48 w-full rounded-none" />
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Skeleton variant="circular" className="w-16 h-16 absolute -top-8 border-4 border-white" />
                      <Skeleton variant="text" className="h-4 w-16 ml-auto" />
                    </div>
                    <Skeleton variant="text" className="h-6 w-3/4 mb-2 mt-6" />
                    <Skeleton variant="text" className="h-4 w-1/2 mb-6" />
                    <Skeleton variant="rectangular" className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              // Actual Vet Cards
              [1, 2, 3].map((i) => (
                <motion.div key={i} variants={staggerItem} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <Card variant="interactive" className="group h-full bg-white flex flex-col justify-between">
                    <div>
                      <div className="h-32 bg-[var(--color-primary-50)] relative overflow-hidden flex items-end p-4">
                        <Badge variant="success" className="mb-2 bg-white text-[var(--color-success-700)] border-none shadow-sm font-semibold">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                        </Badge>
                      </div>
                      <CardContent className="p-6 relative pt-10">
                        <div className="absolute -top-10 left-6 w-20 h-20 rounded-full border-4 border-white bg-slate-100 z-20 flex items-center justify-center overflow-hidden shadow-[var(--shadow-premium-sm)]">
                          <Stethoscope className="w-8 h-8 text-slate-400" />
                        </div>
                        <div className="flex justify-end absolute top-4 right-6">
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-bold text-amber-700">4.9</span>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-[var(--color-foreground)] mb-1">Dr. Sarah Jenkins</h3>
                        <p className="text-sm text-slate-500 font-medium mb-6">Paws & Claws Clinic • 1.2 miles away</p>
                      </CardContent>
                    </div>
                    <div className="p-6 pt-0 mt-auto">
                      <Button variant="secondary" className="w-full justify-center group-hover:bg-[var(--color-primary-600)] group-hover:text-white transition-colors">
                        Book Appointment
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 4. Curated Commerce Categories */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeIn} className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-foreground)] tracking-tight mb-6">
              Curated Wellness & Care
            </h2>
            <p className="text-lg text-slate-600 font-medium">
              Discover premium products selected by veterinary experts for every stage of your pet's life.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Everyday Nutrition", desc: "Premium, balanced diets", color: "bg-orange-50/50" },
              { title: "Post-Surgery Recovery", desc: "Cones, soft food, aids", color: "bg-blue-50/50" },
              { title: "Anxiety & Calm Care", desc: "Supplements & wraps", color: "bg-purple-50/50" },
              { title: "Senior Pet Wellness", desc: "Joint support & comfort", color: "bg-[var(--color-success-50)]" }
            ].map((cat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="h-full"
              >
                <Link href="/shop" className="block h-full outline-none">
                  <Card variant="product" className={`h-full ${cat.color} p-8 flex flex-col justify-end min-h-[280px] group border-transparent hover:border-[var(--color-border-hover)]`}>
                    <div className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowRight className="w-5 h-5 text-[var(--color-foreground)] -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                    </div>
                    <div className="relative z-10 mt-auto">
                      <h3 className="text-xl font-bold text-[var(--color-foreground)] mb-2">{cat.title}</h3>
                      <p className="text-sm text-slate-600 font-medium">{cat.desc}</p>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          
          <motion.div {...fadeIn} className="mt-16 text-center">
            <Button size="lg" variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore the Wellness Shop
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 5. Testimonials - Calm, Breathable Typography */}
      <section className="py-32 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeIn}>
            <div className="flex justify-center gap-1 mb-10">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />)}
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-foreground)] leading-tight tracking-tight mb-10">
              "When Max swallowed a toy, the AI assistant immediately told me to go to emergency, and the app found a 24/7 clinic 5 minutes away. PetNeo literally saved his life."
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
              <div className="text-left">
                <p className="text-base font-bold text-[var(--color-foreground)]">Emily R.</p>
                <p className="text-sm text-slate-500 font-medium">Dog Mom to Max</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Assistant Modal Integration */}
      <Modal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)}
        title="PetNeo AI Assistant"
        description="Describe your pet's symptoms for immediate guidance."
      >
        <div className="space-y-6 pt-2">
          <div className="bg-[var(--color-surface-muted)] p-4 rounded-2xl flex items-start gap-3">
            <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[var(--color-primary-700)]" />
            </div>
            <p className="text-sm text-[var(--color-foreground)] leading-relaxed font-medium">
              Hello! I'm here to help. Please describe what's going on with your pet in as much detail as possible.
            </p>
          </div>
          
          <div className="space-y-3">
            <Input 
              placeholder="e.g. My dog is vomiting and won't eat..." 
              className="py-3"
            />
            <Button variant="primary" className="w-full justify-center">
              Analyze Symptoms
            </Button>
          </div>
          
          <p className="text-xs text-slate-500 text-center font-medium">
            This AI is for informational purposes only and does not replace professional veterinary advice.
          </p>
        </div>
      </Modal>

    </div>
  );
}
