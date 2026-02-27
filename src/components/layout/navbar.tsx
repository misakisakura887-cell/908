"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Wallet, Menu, X, LayoutDashboard, TrendingUp, CircleDollarSign, ArrowDownToLine } from 'lucide-react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getNonce, walletLogin, signMessage, setToken, setUser, clearToken, getToken } from '@/lib/auth';
import { toast } from 'sonner';

const navLinks = [
  { href: '/invest', label: '跟单投资', icon: TrendingUp },
  { href: '/creator', label: 'Strategy Owner', icon: LayoutDashboard },
];

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 检查是否已登录
  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
  }, []);

  // 钱包连接后自动登录
  useEffect(() => {
    if (isConnected && address && !isLoggedIn && !isLoggingIn) {
      handleWalletLogin(address);
    }
  }, [isConnected, address, isLoggedIn]);

  const handleWalletLogin = async (walletAddress: string) => {
    setIsLoggingIn(true);
    try {
      // 1. 获取 nonce
      const message = await getNonce(walletAddress);
      
      // 2. 签名
      const signature = await signMessage(message);
      
      // 3. 登录
      const { token, user } = await walletLogin(walletAddress, message, signature);
      
      // 4. 存储 token 和用户信息
      setToken(token);
      setUser(user);
      setIsLoggedIn(true);
      
      toast.success('登录成功！');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('登录失败，请重试');
      disconnect();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleConnect = () => {
    connect({ connector: injected() });
  };

  const handleDisconnect = () => {
    disconnect();
    clearToken();
    setIsLoggedIn(false);
    toast.success('已断开连接');
  };

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled 
          ? "bg-[hsl(var(--background))]/95 backdrop-blur-xl border-b border-[hsl(var(--border))]" 
          : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                <div className="relative w-10 h-10 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl flex items-center justify-center">
                  <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">M</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-white">Mirror</span>
                <span className="text-xl font-bold text-cyan-400">-AI</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 p-1 bg-[hsl(var(--secondary))]/50 border border-[hsl(var(--border))]/50 rounded-full">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "text-[hsl(var(--muted-foreground))] hover:text-white hover:bg-[hsl(var(--secondary))]"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Deposit Button */}
              <Link href="/ramp">
                <Button variant="secondary" size="sm" className="border border-[hsl(var(--border))]">
                  <ArrowDownToLine size={16} />
                  <span className="hidden sm:inline">存入</span>
                </Button>
              </Link>

              {/* Wallet Button */}
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <Link href="/dashboard">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl hover:bg-[hsl(var(--secondary))]/80 transition-colors cursor-pointer">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        isLoggedIn ? "bg-emerald-400 animate-pulse" : "bg-yellow-400 animate-pulse"
                      )} />
                      <span className="text-sm font-mono text-[hsl(var(--muted-foreground))]">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </span>
                    </div>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-red-400 hover:text-red-300">
                    断开
                  </Button>
                </div>
              ) : (
                <Button onClick={handleConnect} loading={isPending || isLoggingIn} size="sm">
                  <Wallet size={16} />
                  <span className="hidden sm:inline">{isLoggingIn ? '登录中...' : '连接钱包'}</span>
                </Button>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-16 left-0 right-0 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] p-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                      isActive
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "text-[hsl(var(--muted-foreground))] hover:text-white hover:bg-[hsl(var(--secondary))]"
                    )}
                  >
                    <Icon size={20} />
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/ramp"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-[hsl(var(--muted-foreground))] hover:text-white hover:bg-[hsl(var(--secondary))] transition-colors"
              >
                <CircleDollarSign size={20} />
                存入 / 提现
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
