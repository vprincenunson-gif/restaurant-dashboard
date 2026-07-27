'use client';

import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, ClipboardList, BarChart3, Package, TrendingUp, Shield, ArrowRight } from 'lucide-react';

const features = [
  { icon: ClipboardList, title: 'Order Management', description: 'Track orders from placement to delivery with real-time status updates.' },
  { icon: BarChart3, title: 'Analytics & Reports', description: 'Comprehensive insights with revenue charts, peak hours, and top-selling items.' },
  { icon: Package, title: 'Inventory Control', description: 'Monitor stock levels, set reorder alerts, and manage suppliers.' },
  { icon: TrendingUp, title: 'Sales Tracking', description: 'Track daily, weekly, and monthly sales across all payment methods.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">RestaurantOS</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/signin" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link
                href="/signin"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Restaurant Management Platform
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight mb-6">
            Streamline Your
            <span className="text-brand-600"> Restaurant</span> Operations
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed">
            Manage orders, tables, inventory, staff, and analytics from one powerful dashboard.
            Reduce manual effort and improve operational efficiency.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signin" className="btn-primary text-base px-8 py-3">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link href="/signin" className="btn-secondary text-base px-8 py-3">
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            A complete suite of tools to manage your restaurant efficiently
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Restaurant?</h2>
          <p className="text-brand-100 mb-8 max-w-lg mx-auto">
            Join thousands of restaurants using RestaurantOS to streamline their operations.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 bg-white text-brand-700 px-8 py-3 rounded-lg font-semibold hover:bg-brand-50 transition-colors"
          >
            Get Started Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-brand-600" />
              <span className="text-sm font-medium text-gray-900">RestaurantOS</span>
            </div>
            <p className="text-sm text-gray-500">© 2026 RestaurantOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
