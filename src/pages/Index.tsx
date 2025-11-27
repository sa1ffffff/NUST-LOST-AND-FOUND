import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Package } from "lucide-react";
import ItemFormModal from "@/components/ItemFormModal";
import { Button } from "@/components/ui/button";
import nustBackground from "@/assets/nust-background.png";

const Index = () => {
  const [modalType, setModalType] = useState<"found" | "lost" | null>(null);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${nustBackground})` }}
      />
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />

      <div className="container max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-4 tracking-tight">
            NUST Lost & Found
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A community-driven platform to reunite people with their belongings
          </p>
        </div>

        {/* Main action cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Found card */}
          <div
            onClick={() => setModalType("found")}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-3xl p-12 backdrop-blur-xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 shadow-2xl hover:shadow-accent/20 transition-all duration-500 hover:scale-[1.02] hover:border-accent/50">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Package className="w-10 h-10 text-accent" />
                </div>
                
                <h2 className="text-3xl font-bold text-foreground mb-3">
                  I Found Something
                </h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Help someone recover their lost item by reporting what you found
                </p>
                
                <div className="inline-flex items-center text-accent font-medium group-hover:translate-x-2 transition-transform duration-300">
                  Report found item
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Lost card */}
          <div
            onClick={() => setModalType("lost")}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-3xl p-12 backdrop-blur-xl bg-gradient-to-br from-card/80 to-card/40 border border-border/50 shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:scale-[1.02] hover:border-primary/50">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Search className="w-10 h-10 text-primary" />
                </div>
                
                <h2 className="text-3xl font-bold text-foreground mb-3">
                  I Lost Something
                </h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Report your lost item and increase your chances of finding it
                </p>
                
                <div className="inline-flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform duration-300">
                  Report lost item
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Browse links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
          <Link to="/found">
            <Button variant="outline" size="lg" className="w-full sm:w-auto backdrop-blur-sm bg-background/50 hover:bg-background/70">
              Browse Found Items
            </Button>
          </Link>
          <Link to="/lost">
            <Button variant="outline" size="lg" className="w-full sm:w-auto backdrop-blur-sm bg-background/50 hover:bg-background/70">
              Browse Lost Items
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 z-10">
        <div className="text-center text-sm text-foreground/70 backdrop-blur-sm bg-background/30 py-3 px-4 rounded-lg mx-auto max-w-md">
          <p className="mb-1">Created by</p>
          <div className="flex items-center justify-center gap-4">
            <a 
              href="https://github.com/sa1ffffff" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors duration-200"
            >
              @sa1ffffff
            </a>
            <span>•</span>
            <a 
              href="https://github.com/kaazmi12" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors duration-200"
            >
              @kaazmi12
            </a>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ItemFormModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        type={modalType || "found"}
      />
    </div>
  );
};

export default Index;
