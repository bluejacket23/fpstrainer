"use client";

import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, Cpu } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    // Handle page-based active links
    if (pathname === '/dashboard') {
      setActiveLink('dashboard');
    } else if (pathname === '/upload') {
      setActiveLink('upload');
    } else if (pathname === '/account') {
      setActiveLink('account');
    } else if (pathname === '/') {
      // Handle scroll-based active links on home page
      const handleScroll = () => {
        const sections = ['hero', 'how-it-works', 'features', 'pricing'];
        const scrollPosition = window.scrollY + 100;

        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const { offsetTop, offsetHeight } = element;
            if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
              setActiveLink(section);
              break;
            }
          }
        }
      };

      window.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [pathname]);

  return (
    <nav className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Area */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <Cpu className="text-neon group-hover:animate-spin-slow transition-all" />
              <div className="text-2xl font-black font-display tracking-widest text-white">
                FPS<span className="text-neon">TRAINER</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {pathname === '/' && (
              <>
                <NavLink href="#how-it-works" isActive={activeLink === 'how-it-works'}>HOW IT WORKS</NavLink>
                <NavLink href="#features" isActive={activeLink === 'features'}>MODULES</NavLink>
                <NavLink href="#pricing" isActive={activeLink === 'pricing'}>PRICING</NavLink>
              </>
            )}
            
            {user ? (
              <>
                <NavLink href="/dashboard" isActive={activeLink === 'dashboard'}>DASHBOARD</NavLink>
                <NavLink href="/upload" isActive={activeLink === 'upload'}>UPLOAD</NavLink>
                <NavLink href="/account" isActive={activeLink === 'account'}>ACCOUNT</NavLink>
                <div className="h-6 w-px bg-white/10 mx-2" />
                <button onClick={signOut} className="text-xs font-mono text-cyber hover:text-white transition-colors tracking-widest">
                  [ LOGOUT ]
                </button>
              </>
            ) : (
              <Link href="/login">
                <button className="relative overflow-hidden group bg-white/5 border border-neon/30 text-neon px-6 py-2 font-bold font-display tracking-widest hover:bg-neon hover:text-black transition-all duration-300 clip-button">
                  <span className="relative z-10">LOGIN // SYSTEM</span>
                  <div className="absolute inset-0 bg-neon transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-neon p-2 border border-neon/20 bg-neon/5">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black border-b border-neon/20"
          >
            <div className="px-4 py-6 space-y-4 flex flex-col font-mono text-sm">
              {pathname === '/' && (
                <>
                  <MobileLink href="#how-it-works" onClick={() => setIsOpen(false)}>HOW IT WORKS</MobileLink>
                  <MobileLink href="#features" onClick={() => setIsOpen(false)}>MODULES</MobileLink>
                  <MobileLink href="#pricing" onClick={() => setIsOpen(false)}>PRICING</MobileLink>
                </>
              )}
              {user ? (
                <>
                  <MobileLink href="/dashboard" onClick={() => setIsOpen(false)}>DASHBOARD</MobileLink>
                  <MobileLink href="/upload" onClick={() => setIsOpen(false)}>UPLOAD CLIP</MobileLink>
                  <MobileLink href="/account" onClick={() => setIsOpen(false)}>ACCOUNT</MobileLink>
                  <button onClick={signOut} className="text-left text-cyber py-2 uppercase tracking-widest">Disconnect</button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)} className="text-neon font-bold py-2 uppercase tracking-widest border-l-2 border-neon pl-4">Login System</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function NavLink({ href, children, isActive }: { href: string; children: React.ReactNode; isActive?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`relative text-xs font-bold transition-colors uppercase tracking-[0.2em] font-mono group px-3 py-2 rounded ${
        isActive 
          ? 'bg-white/10 text-white' 
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {children}
      {!isActive && (
        <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-neon transition-all group-hover:w-full" />
      )}
    </Link>
  );
}

function MobileLink({ href, onClick, children }: any) {
  return (
    <Link href={href} onClick={onClick} className="text-gray-400 hover:text-neon py-2 uppercase tracking-widest border-l-2 border-transparent hover:border-neon pl-4 transition-all">
      {children}
    </Link>
  );
}
