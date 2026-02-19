"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative w-10 h-10 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center font-black text-cyan-400">
              9
            </div>
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic">
            908 <span className="text-cyan-400 not-italic">Quant</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-900/50 border border-slate-800/50 p-1 rounded-full backdrop-blur-xl">
          <NavLink href="/strategies" label="Strategies" />
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="#docs" label="Docs" />
        </div>

        {/* Connect Wallet Button */}
        {isConnected ? (
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-full text-sm font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
            <Button variant="secondary" size="sm" onClick={() => disconnect()}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button onClick={handleConnect}>
            <Wallet size={16} className="mr-2" />
            Connect Wallet
          </Button>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-5 py-2 rounded-full text-xs font-bold transition-all text-slate-500 hover:text-slate-200 hover:bg-slate-800"
    >
      {label}
    </Link>
  );
}
